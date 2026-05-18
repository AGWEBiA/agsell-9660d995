// Webhook Handler for Kiwify Events — Subscription Lifecycle
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.203.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.203.0/encoding/hex.ts";
import { logToSystem, updateWebhookEvent } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-kiwify-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface KiwifyPayload {
  order_id: string;
  order_status: string;
  product_id?: string;
  product_name?: string;
  Product?: {
    product_id?: string;
    product_name?: string;
  };
  Customer: {
    email: string;
    full_name: string;
    mobile: string;
  };
  Subscription?: {
    id: string;
    status: string;
    plan?: {
      id: string;
      name: string;
    };
    start_date?: string;
    next_payment?: string;
  };
  Commissions?: {
    charge_amount?: number;
    product_base_price?: number;
  };
  payment_method: string;
  payment_status: string;
  order_value?: number;
  checkout_link?: string;
  subscription_id?: string;
  created_at: string;
  custom_fields?: {
    organization_name?: string;
    user_name?: string;
  };
  [key: string]: unknown;
}

const logStep = async (
  supabase: SupabaseClient,
  step: string,
  details?: unknown,
  level: "info" | "warning" | "error" = "info",
  organization_id?: string,
) => {
  await logToSystem(supabase, {
    source: "webhook-kiwify",
    event: step,
    message: typeof details === "string" ? details : JSON.stringify(details),
    payload: details,
    level,
    organization_id,
  });
};

// Extract product_id from various payload locations
function extractProductId(payload: KiwifyPayload): string | undefined {
  return payload.Product?.product_id || payload.product_id || undefined;
}

// Extract order value in BRL (convert from centavos if needed)
function extractOrderValue(payload: KiwifyPayload): number {
  if (payload.order_value) return payload.order_value;
  const chargeAmount =
    payload.Commissions?.charge_amount ||
    payload.Commissions?.product_base_price;
  if (chargeAmount) return chargeAmount / 100; // centavos to BRL
  return 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
  let webhookEventId: string | undefined;

  try {
    const url = new URL(req.url);
    const signature = req.headers.get("x-kiwify-signature");
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody || "{}") as KiwifyPayload;
    const productId = extractProductId(payload);
    const customerEmail = payload.Customer?.email?.toLowerCase();

    // Check if we already have an event ID from unified-webhook
    webhookEventId = req.headers.get("X-Webhook-Event-Id") || undefined;

    if (!webhookEventId) {
      // --- Store webhook event early (if not already stored by unified-webhook) ---
      const { data: webhookEvent, error: webhookError } = await supabase
        .from("webhook_events")
        .insert({
          source: "kiwify",
          event_type: "received",
          payload: payload,
          processed: false,
        })
        .select()
        .single();

      if (webhookError) throw webhookError;
      webhookEventId = webhookEvent.id;
    }

    await logStep(supabase, "Webhook processing started", {
      status: payload.order_status,
      email: customerEmail,
      product: productId,
      event_id: webhookEventId,
    });

    // --- Handle alternative Kiwify payload schemas (flat structure) ---
    // Cart abandonment, subscription lifecycle and other non-order events
    // use a flat shape (email/status at root, no Customer.* or order_status).
    const flatEmail = (payload as any).email as string | undefined;
    const flatStatus = (payload as any).status as string | undefined;
    if (!payload.order_status && !payload.Customer && (flatEmail || flatStatus)) {
      const flatProductId = (payload as any).product_id as string | undefined;
      const flatCheckout = (payload as any).checkout_link as string | undefined;
      let mappedType = `flat.${flatStatus || "unknown"}`;
      if (flatStatus === "abandoned") mappedType = "cart.abandoned";

      // Try to match the AG Sell plan by product_id / checkout_link
      let isAgsellPlan = false;
      if (flatProductId || flatCheckout) {
        const { data: agPlans } = await supabase
          .from("plans")
          .select("id, kiwify_product_id, kiwify_product_id_yearly, kiwify_checkout_url, kiwify_checkout_url_yearly")
          .eq("is_active", true);
        isAgsellPlan = !!agPlans?.some((p: any) =>
          (flatProductId && (p.kiwify_product_id === flatProductId || p.kiwify_product_id_yearly === flatProductId)) ||
          (flatCheckout && ((p.kiwify_checkout_url || "").includes(flatCheckout) || (p.kiwify_checkout_url_yearly || "").includes(flatCheckout)))
        );
      }

      // Persist abandoned/lifecycle leads in checkout_leads when relevant
      if (flatEmail && isAgsellPlan && flatStatus === "abandoned") {
        const lower = flatEmail.toLowerCase();
        const { data: existing } = await supabase
          .from("checkout_leads")
          .select("id")
          .ilike("email", lower)
          .maybeSingle();
        const leadPayload: Record<string, unknown> = {
          email: lower,
          name: (payload as any).name || (payload as any).first_name || "Kiwify Lead",
          source: "kiwify",
          status: "abandoned",
          updated_at: new Date().toISOString(),
        };
        if (existing) {
          await supabase.from("checkout_leads").update(leadPayload).eq("id", existing.id);
        } else {
          await supabase.from("checkout_leads").insert(leadPayload);
        }
      }

      await supabase
        .from("webhook_events")
        .update({
          event_type: mappedType,
          processed: true,
          processed_at: new Date().toISOString(),
          error_message: isAgsellPlan
            ? null
            : "Skipped: non-AG Sell product (flat payload)",
        })
        .eq("id", webhookEventId);

      await logStep(supabase, "Flat-schema webhook handled", {
        mappedType,
        isAgsellPlan,
        email: flatEmail,
        productId: flatProductId,
      });

      return new Response(
        JSON.stringify({
          success: true,
          event_id: webhookEventId,
          handled: mappedType,
          is_agsell_plan: isAgsellPlan,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Signature verification ---
    const kiwifySecret = Deno.env.get("KIWIFY_WEBHOOK_SECRET");
    if (kiwifySecret && signature) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(kiwifySecret);
      const messageData = encoder.encode(rawBody);
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        messageData,
      );
      const expectedSignature = encodeHex(new Uint8Array(signatureBuffer));

      if (signature !== expectedSignature) {
        await logStep(
          supabase,
          "ERROR: Invalid signature",
          { received: signature },
          "error",
        );
        if (webhookEventId)
          await updateWebhookEvent(supabase, webhookEventId, {
            processed: true,
            error_message: "Invalid signature",
          });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await logStep(supabase, "Signature verified");
    }

    // --- Map Kiwify status ---
    // Prefer the native `webhook_event_type` field (more precise) and fall back to order_status.
    const nativeEventType = (payload as any).webhook_event_type as string | undefined;
    const eventTypeMap: Record<string, string> = {
      paid: "purchase.approved",
      waiting_payment: "purchase.pending",
      refused: "purchase.refused",
      refunded: "purchase.refunded",
      chargedback: "purchase.chargeback",
      completed: "purchase.approved",
    };
    const nativeMap: Record<string, string> = {
      order_approved: "purchase.approved",
      subscription_renewed: "subscription.renewed",
      subscription_canceled: "subscription.canceled",
      subscription_late: "subscription.late",
      pix_created: "purchase.pending",
      billet_created: "purchase.pending",
      order_rejected: "purchase.refused",
      order_refunded: "purchase.refunded",
      chargeback: "purchase.chargeback",
    };
    const eventType =
      (nativeEventType && nativeMap[nativeEventType]) ||
      eventTypeMap[payload.order_status] ||
      `unknown.${nativeEventType || payload.order_status}`;

    // --- Find plan by Kiwify product ID ---
    let plan: {
      id: string;
      name: string;
      slug: string;
      price_monthly: number;
    } | null = null;
    const orderValue = extractOrderValue(payload);
    const checkoutLink = payload.checkout_link; // e.g., "iCnaIJs"

    // Strategy 1: Match by checkout_link (most precise — each plan has unique checkout URL)
    if (checkoutLink && !plan) {
      const { data: allPlans } = await supabase
        .from("plans")
        .select(
          "id, name, slug, price_monthly, kiwify_checkout_url, kiwify_checkout_url_yearly",
        )
        .eq("is_active", true);

      if (allPlans) {
        for (const p of allPlans) {
          const monthlyUrl = p.kiwify_checkout_url || "";
          const yearlyUrl = p.kiwify_checkout_url_yearly || "";
          if (
            monthlyUrl.includes(checkoutLink) ||
            yearlyUrl.includes(checkoutLink)
          ) {
            plan = {
              id: p.id,
              name: p.name,
              slug: p.slug,
              price_monthly: p.price_monthly,
            };
            await logStep(supabase, "Plan matched by checkout_link", {
              link: checkoutLink,
              plan: p.name,
            });
            break;
          }
        }
      }
    }

    // Strategy 2: Match by Subscription.plan.name
    if (!plan && payload.Subscription?.plan?.name) {
      const subPlanName = payload.Subscription.plan.name;
      const { data: namedPlan } = await supabase
        .from("plans")
        .select("id, name, slug, price_monthly")
        .ilike("name", `%${subPlanName}%`)
        .eq("is_active", true)
        .maybeSingle();
      if (namedPlan) {
        plan = namedPlan;
        await logStep(supabase, "Plan matched by subscription name", {
          subPlanName,
          plan: namedPlan.name,
        });
      }
    }

    // Strategy 3: Match by product_id (single match)
    if (!plan && productId) {
      const { data: matchedPlans } = await supabase
        .from("plans")
        .select("id, name, slug, price_monthly")
        .or(
          `kiwify_product_id.eq.${productId},kiwify_product_id_yearly.eq.${productId}`,
        )
        .eq("is_active", true);

      if (matchedPlans && matchedPlans.length === 1) {
        plan = matchedPlans[0];
      } else if (matchedPlans && matchedPlans.length > 1 && orderValue > 0) {
        // Multiple plans — match by closest price
        const closestPlan = matchedPlans.reduce((best, p) => {
          const diff = Math.abs(p.price_monthly - orderValue);
          const bestDiff = Math.abs(best.price_monthly - orderValue);
          return diff < bestDiff ? p : best;
        }, matchedPlans[0]);
        plan = closestPlan;
        await logStep(supabase, "Multiple plans matched, selected by price", {
          selected: closestPlan.name,
          orderValue,
        });
      }
    }

    // Strategy 4: Fallback from checkout_leads
    if (!plan && customerEmail) {
      const { data: lead } = await supabase
        .from("checkout_leads")
        .select("plan_id")
        .ilike("email", customerEmail)
        .not("plan_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lead?.plan_id) {
        const { data: leadPlan } = await supabase
          .from("plans")
          .select("id, name, slug, price_monthly")
          .eq("id", lead.plan_id)
          .single();
        if (leadPlan) {
          plan = leadPlan;
          await logStep(supabase, "Plan resolved from checkout_lead", {
            planName: leadPlan.name,
          });
        }
      }
    }

    await logStep(supabase, "Plan lookup", {
      productId,
      found: !!plan,
      planName: plan?.name,
    });

    // --- Update webhook event with mapped type ---
    if (webhookEventId) {
      await supabase
        .from("webhook_events")
        .update({
          event_type: eventType,
          payload: payload, // Update payload in case it was modified or to ensure consistency
        })
        .eq("id", webhookEventId);
    }

    // --- Early exit: ignore products that are not AG Sell plans ---
    // Kiwify webhook receives events from ALL products in the account.
    // If the order doesn't match any AG Sell plan, acknowledge and skip.
    const isApprovedOrPending =
      payload.order_status === "paid" ||
      payload.order_status === "completed" ||
      payload.order_status === "waiting_payment";

    if (!plan && isApprovedOrPending) {
      await logStep(supabase, "SKIPPED: product is not an AG Sell plan", {
        productId,
        productName: payload.Product?.product_name || payload.product_name,
        checkoutLink,
        orderId: payload.order_id,
        email: customerEmail,
      });
      if (webhookEventId) {
        await supabase
          .from("webhook_events")
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error_message: "Skipped: product is not an AG Sell plan",
          })
          .eq("id", webhookEventId);
      }
      return new Response(
        JSON.stringify({
          success: true,
          event_id: webhookEventId,
          skipped: true,
          reason: "not_an_agsell_plan",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Upsert gateway product for automation triggers
    const kiwifyProductName =
      payload.Product?.product_name || payload.product_name;
    
    // Resolve organization ID for this event
    let targetOrgId: string = "";
    
    // 1. Try from query param (best for multi-tenancy)
    targetOrgId = url.searchParams.get("org_id") || "";
    
    // 2. Try from checkout_leads
    if (!targetOrgId && customerEmail) {
      const { data: leadOrg } = await supabase
        .from("checkout_leads")
        .select("organization_id")
        .ilike("email", customerEmail)
        .not("organization_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      targetOrgId = leadOrg?.organization_id || "";
    }

    // 3. Fallback: find any org that has this product ID in their integrations or plans
    // (We'll refine this as needed, but for now we prioritize explicit links)

    if (kiwifyProductName && targetOrgId) {
      await supabase.from("gateway_products").upsert(
        {
          organization_id: targetOrgId,
          gateway: "kiwify",
          external_product_id: productId || "",
          product_name: kiwifyProductName,
          price: orderValue || null,
          currency: "BRL",
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,gateway,external_product_id" },
      );
    }

    // Update webhook_events with resolved organization_id early
    if (webhookEventId && targetOrgId) {
      await supabase
        .from("webhook_events")
        .update({ organization_id: targetOrgId })
        .eq("id", webhookEventId);
    }

    // customerEmail already defined above

    // --- Update checkout_leads with payment status ---
    if (customerEmail) {
      const paymentMethod = (payload.payment_method || "").toLowerCase();
      let leadStatus = "started";

      if (
        payload.order_status === "paid" ||
        payload.order_status === "completed"
      ) {
        leadStatus = "converted";
      } else if (payload.order_status === "waiting_payment") {
        if (paymentMethod.includes("boleto") || paymentMethod === "bank_slip") {
          leadStatus = "boleto_generated";
        } else if (paymentMethod.includes("pix")) {
          leadStatus = "pix_generated";
        } else {
          leadStatus = "waiting_payment";
        }
      } else if (payload.order_status === "refused") {
        leadStatus = "expired";
      } else if (payload.order_status === "refunded") {
        leadStatus = "refunded";
      } else if (payload.order_status === "chargedback") {
        leadStatus = "refunded";
      }

      const leadUpdate: Record<string, unknown> = {
        status: leadStatus,
        source: "kiwify",
        updated_at: new Date().toISOString(),
      };
      if (leadStatus === "converted") {
        leadUpdate.converted = true;
        leadUpdate.converted_at = new Date().toISOString();
      }

      const { data: existingLead } = await supabase
        .from("checkout_leads")
        .select("id")
        .ilike("email", customerEmail)
        .maybeSingle();

      if (existingLead) {
        await supabase
          .from("checkout_leads")
          .update(leadUpdate)
          .eq("id", existingLead.id);
        await logStep(supabase, "checkout_leads updated", {
          email: customerEmail,
          status: leadStatus,
        });
      } else {
        await supabase.from("checkout_leads").insert({
          email: customerEmail,
          name: payload.Customer?.full_name || "Kiwify Lead",
          plan_id: plan?.id || null,
          billing_cycle: detectBillingCycle(payload),
          source: "kiwify",
          status: leadStatus,
          converted: leadStatus === "converted",
          converted_at:
            leadStatus === "converted" ? new Date().toISOString() : null,
        });
        await logStep(supabase, "checkout_leads created", {
          email: customerEmail,
          status: leadStatus,
        });
      }
    }

    // --- Process based on event type ---
    if (
      (payload.order_status === "paid" ||
        payload.order_status === "completed") &&
      customerEmail
    ) {
      const { data: alreadyProcessed } = await supabase
        .from("webhook_events")
        .select("id")
        .eq("source", "kiwify")
        .neq("id", webhookEventId)
        .eq("processed", true)
        .contains("payload", { order_id: payload.order_id })
        .limit(1)
        .maybeSingle();

      if (alreadyProcessed) {
        await logStep(
          supabase,
          "SKIPPED: order already processed (idempotency)",
          {
            orderId: payload.order_id,
          },
        );
        if (webhookEventId)
          await supabase
            .from("webhook_events")
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq("id", webhookEventId);
        return new Response(
          JSON.stringify({
            success: true,
            event_id: webhookEventId,
            skipped: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      await logStep(supabase, "Processing approved purchase");

      // Find existing user by email
      const { data: userData } = await supabase.auth.admin.listUsers();
      const existingUser = userData?.users?.find(
        (u) => u.email?.toLowerCase() === customerEmail,
      );

      if (existingUser) {
        // Existing user — activate/update subscription
        await logStep(supabase, "Found existing user", {
          userId: existingUser.id,
        });

        // Find user's organization
        const { data: membership } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", existingUser.id)
          .limit(1)
          .maybeSingle();

        if (membership && plan) {
          targetOrgId = membership.organization_id;
          await activateSubscription(supabase, {
            organizationId: targetOrgId,
            planId: plan.id,
            planSlug: plan.slug,
            kiwifyOrderId: payload.order_id,
            kiwifySubscriptionId: payload.Subscription?.id,
            billingCycle: detectBillingCycle(payload),
          });
          await logStep(supabase, "Subscription activated for existing user");

          // Trigger automations for purchase
          await triggerPurchaseAutomation(supabase, targetOrgId, customerEmail, payload);

          const hasLoggedIn = !!existingUser.last_sign_in_at;
          const alreadyEmailed =
            !!existingUser.user_metadata?.credentials_emailed_at;
          if (!hasLoggedIn && !alreadyEmailed) {
            const customerName =
              existingUser.user_metadata?.full_name ||
              payload.Customer.full_name ||
              "Usuário";
            const temporaryPassword = generatePassword();

            const { error: passwordError } =
              await supabase.auth.admin.updateUserById(existingUser.id, {
                password: temporaryPassword,
                user_metadata: {
                  ...(existingUser.user_metadata || {}),
                  credentials_emailed_at: new Date().toISOString(),
                },
              });

            if (passwordError) {
              await logStep(
                supabase,
                "ERROR updating temporary password for existing user",
                passwordError.message,
              );
            } else {
              const { data: organizationData } = await supabase
                .from("organizations")
                .select("name")
                .eq("id", targetOrgId)
                .maybeSingle();

              await sendWelcomeEmail(supabase, {
                email: customerEmail,
                name: customerName,
                password: temporaryPassword,
                planName: plan.name,
                organizationName: organizationData?.name || "AG Sell",
              });

              await logStep(
                supabase,
                "Credentials email sent for existing user onboarding",
                {
                  email: customerEmail,
                },
              );
            }
          }
        } else if (!membership && plan) {
          // Existing user without organization — create org + subscription + send email
          await logStep(supabase, "Existing user without org, creating one");
          const customerName =
            existingUser.user_metadata?.full_name ||
            payload.Customer.full_name ||
            "Usuário";
          const orgName = `Org de ${customerName}`;
          const slug = orgName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

          const { data: newOrg } = await supabase
            .from("organizations")
            .insert({
              name: orgName,
              slug: `${slug}-${Date.now()}`,
              plan_id: plan.id,
            })
            .select("id")
            .single();

          if (newOrg?.id) {
            targetOrgId = newOrg.id;
            await supabase.from("organization_members").insert({
              organization_id: targetOrgId,
              user_id: existingUser.id,
              role: "owner",
            });
            await activateSubscription(supabase, {
              organizationId: targetOrgId,
              planId: plan.id,
              planSlug: plan.slug,
              kiwifyOrderId: payload.order_id,
              kiwifySubscriptionId: payload.Subscription?.id,
              billingCycle: detectBillingCycle(payload),
            });

            // Trigger automations for purchase
            await triggerPurchaseAutomation(supabase, targetOrgId, customerEmail, payload);

            // Send credentials email for existing user without org
            const hasLoggedIn = !!existingUser.last_sign_in_at;
            const alreadyEmailed =
              !!existingUser.user_metadata?.credentials_emailed_at;
            if (!hasLoggedIn && !alreadyEmailed) {
              const temporaryPassword = generatePassword();
              const { error: pwError } =
                await supabase.auth.admin.updateUserById(existingUser.id, {
                  password: temporaryPassword,
                  user_metadata: {
                    ...(existingUser.user_metadata || {}),
                    credentials_emailed_at: new Date().toISOString(),
                  },
                });
              if (!pwError) {
                await sendWelcomeEmail(supabase, {
                  email: customerEmail,
                  name: customerName,
                  password: temporaryPassword,
                  planName: plan.name,
                  organizationName: orgName,
                });
                await logStep(
                  supabase,
                  "Credentials email sent for existing user (new org)",
                  {
                    email: customerEmail,
                  },
                );
              }
            }

            await logStep(
              supabase,
              "Org + subscription created for existing user",
              {
                orgId: targetOrgId,
              },
            );
          }
        }
      } else if (plan) {
        // New user — create account + org + subscription
        await logStep(supabase, "Creating new user account");

        const customerName = payload.Customer.full_name || "Usuário Kiwify";
        const orgName =
          (payload as any).custom_fields?.organization_name ||
          `Org de ${customerName}`;
        const password = generatePassword();

        const { data: authData, error: authError } =
          await supabase.auth.admin.createUser({
            email: customerEmail,
            password,
            email_confirm: true,
            user_metadata: {
              name: customerName,
              full_name: customerName,
              credentials_emailed_at: new Date().toISOString(),
            },
          });

        if (authError) {
          await logStep(supabase, "ERROR creating user", authError.message);
          // If user already exists but wasn't found (edge case), try to continue
          if (!authError.message.includes("already been registered")) {
            throw authError;
          }
        }

        const userId = authData?.user?.id;
        if (userId) {
          const slug = orgName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

          // Create organization directly (RPC uses auth.uid() which is null in service context)
          const { data: newOrg, error: orgError } = await supabase
            .from("organizations")
            .insert({
              name: orgName,
              slug: `${slug}-${Date.now()}`,
              plan_id: plan.id,
              plan: plan.slug,
            })
            .select("id")
            .single();

          if (orgError || !newOrg?.id) {
            await logStep(
              supabase,
              "ERROR creating organization",
              orgError?.message,
            );
          } else {
            targetOrgId = newOrg.id;
            // Add user as owner
            await supabase.from("organization_members").insert({
              organization_id: targetOrgId,
              user_id: userId,
              role: "owner",
            });

            await activateSubscription(supabase, {
              organizationId: targetOrgId,
              planId: plan.id,
              planSlug: plan.slug,
              kiwifyOrderId: payload.order_id,
              kiwifySubscriptionId: payload.Subscription?.id,
              billingCycle: detectBillingCycle(payload),
            });

            // Trigger automations for purchase
            await triggerPurchaseAutomation(supabase, targetOrgId, customerEmail, payload);

            // Send welcome email
            await sendWelcomeEmail(supabase, {
              email: customerEmail,
              name: customerName,
              password,
              planName: plan.name,
              organizationName: orgName,
            });

            await logStep(
              supabase,
              "New account created and subscription activated",
              {
                userId,
                orgId: targetOrgId,
              },
            );
          }
        }
      }

      // Create/update contact
      if (plan && targetOrgId) {
        await upsertContact(supabase, payload, plan.name, targetOrgId);
      }

      if (webhookEventId) {
        await supabase
          .from("webhook_events")
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            organization_id: targetOrgId || null,
          })
          .eq("id", webhookEventId);
      }

      // Sync WhatsApp groups
      if (existingUser) {
        await callSyncUser(existingUser.id, true);
      }
    }

    // --- Handle refunds, cancellations and chargebacks ---
    if (
      (payload.order_status === "refunded" ||
        payload.order_status === "chargedback" ||
        nativeEventType === "subscription_canceled" ||
        nativeEventType === "subscription_late") &&
      customerEmail
    ) {
      await logStep(supabase, "Processing cancellation/refund/late", {
        orderId: payload.order_id,
        subscriptionId: payload.Subscription?.id,
        nativeEventType,
        orderStatus: payload.order_status,
      });

      // IMPORTANT: Only process if this is an AG Sell product
      if (!plan) {
        await logStep(supabase, "SKIPPED: cancellation for non-AG Sell product", {
          productId,
          productName: payload.Product?.product_name || payload.product_name,
        });
        if (webhookEventId) {
          await updateWebhookEvent(supabase, webhookEventId, {
            processed: true,
            error_message: "Skipped: cancellation for non-AG Sell product",
          });
        }
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const subscriptionId = payload.Subscription?.id || payload.subscription_id;
      const orderId = payload.order_id;

      let targetSub: { id: string; organization_id: string; status: string } | null = null;

      // Try matching by subscription_id first (most precise)
      if (subscriptionId) {
        const { data } = await supabase
          .from("subscriptions")
          .select("id, organization_id, status")
          .eq("provider_subscription_id", subscriptionId)
          .eq("payment_provider", "kiwify")
          .maybeSingle();
        if (data) targetSub = data;
      }

      // Fallback 1: match by order_id
      if (!targetSub && orderId) {
        const { data } = await supabase
          .from("subscriptions")
          .select("id, organization_id, status")
          .eq("provider_subscription_id", orderId)
          .eq("payment_provider", "kiwify")
          .maybeSingle();
        if (data) targetSub = data;
      }

      if (targetSub) {
        // Decide whether to deactivate immediately or just update status
        // Kiwify subscription_canceled usually means "don't renew", user should keep access until period ends.
        const isImmediateDeactivation = 
          payload.order_status === "refunded" || 
          payload.order_status === "chargedback" ||
          (nativeEventType === "subscription_late" && payload.order_status === "refused");

        const newStatus = 
          (payload.order_status === "refunded" || nativeEventType === "subscription_canceled") 
            ? "canceled" 
            : "past_due";

        // 1. Update the subscription status
        await supabase
          .from("subscriptions")
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq("id", targetSub.id);

        // 2. Only remove plan_id if it's an immediate deactivation (refund/chargeback/late)
        // For "canceled" (stop renewal), we keep the plan_id so they have access until period ends
        if (isImmediateDeactivation) {
          await supabase
            .from("organizations")
            .update({ plan_id: null })
            .eq("id", targetSub.organization_id);
            
          await logStep(supabase, "Plan deactivated immediately", {
            orgId: targetSub.organization_id,
            status: newStatus,
            reason: payload.order_status || nativeEventType,
          });

          // Sync WhatsApp groups - remove from deactivated org's users
          const { data: orgMembers } = await supabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", targetSub.organization_id);

          if (orgMembers) {
            for (const member of orgMembers) {
              await callSyncUser(member.user_id, false);
            }
          }
        } else {
          await logStep(supabase, "Subscription status updated (access maintained until period ends)", {
            orgId: targetSub.organization_id,
            status: newStatus,
          });
        }
      } else {
        await logStep(
          supabase,
          "WARNING: No matching subscription found for cancellation/refund",
          { orderId, subscriptionId, email: customerEmail },
        );
      }

      if (webhookEventId) {
        await updateWebhookEvent(supabase, webhookEventId, {
          processed: true,
          processed_at: new Date().toISOString(),
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, event_id: webhookEventId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("[KIWIFY-WEBHOOK] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// --- Helper Functions ---

function detectBillingCycle(payload: KiwifyPayload): "monthly" | "yearly" {
  const subPlan = payload.Subscription?.plan?.name?.toLowerCase() || "";
  if (
    subPlan.includes("anual") ||
    subPlan.includes("yearly") ||
    subPlan.includes("annual")
  ) {
    return "yearly";
  }
  return "monthly";
}

// deno-lint-ignore no-explicit-any
async function activateSubscription(
  supabase: any,
  params: {
    organizationId: string;
    planId: string;
    planSlug?: string;
    kiwifyOrderId: string;
    kiwifySubscriptionId?: string;
    billingCycle: "monthly" | "yearly";
  },
) {
  const {
    organizationId,
    planId,
    planSlug,
    kiwifyOrderId,
    kiwifySubscriptionId,
    billingCycle,
  } = params;

  // Check if there's an existing subscription with a different provider
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select(
      "id, payment_provider, provider_subscription_id, stripe_customer_id",
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  // If switching FROM Stripe, attempt to cancel the Stripe subscription
  if (
    existingSub?.payment_provider === "stripe" &&
    existingSub?.provider_subscription_id
  ) {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      try {
        const { default: Stripe } =
          await import("https://esm.sh/stripe@14.21.0");
        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
        await stripe.subscriptions.update(
          existingSub.provider_subscription_id,
          {
            cancel_at_period_end: true,
          },
        );
        await logStep(supabase, "Cancelled previous Stripe subscription", {
          subId: existingSub.provider_subscription_id,
        });
      } catch (err: any) {
        await logStep(
          supabase,
          "Warning: could not cancel Stripe subscription",
          err,
        );
      }
    }
  }

  // Update org plan
  const orgUpdate: Record<string, any> = { plan_id: planId };
  if (planSlug) orgUpdate.plan = planSlug;
  await supabase
    .from("organizations")
    .update(orgUpdate)
    .eq("id", organizationId);

  const periodDays = billingCycle === "yearly" ? 365 : 30;
  const subData = {
    organization_id: organizationId,
    plan_id: planId,
    status: "active" as const,
    billing_cycle: billingCycle,
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(
      Date.now() + periodDays * 24 * 60 * 60 * 1000,
    ).toISOString(),
    payment_provider: "kiwify",
    provider_subscription_id: kiwifySubscriptionId || kiwifyOrderId,
  };

  if (existingSub) {
    await supabase
      .from("subscriptions")
      .update(subData)
      .eq("id", existingSub.id);
  } else {
    await supabase.from("subscriptions").insert(subData);
  }
}

// deno-lint-ignore no-explicit-any
async function upsertContact(
  supabase: any,
  payload: KiwifyPayload,
  planName: string,
  organization_id: string,
) {
  const customer = payload.Customer;
  if (!customer?.email || !organization_id) return;

  const orgId = organization_id;

  const { data: owner } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  if (!owner) {
    console.warn(`[upsertContact] No owner found for org ${orgId}`);
    return;
  }

  const nameParts = customer.full_name.split(" ");

  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id")
    .eq("email", customer.email.toLowerCase())
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!existingContact) {
    await supabase.from("contacts").insert({
      organization_id: orgId,
      user_id: owner.user_id,
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(" ") || null,
      email: customer.email.toLowerCase(),
      phone: customer.mobile,
      source: "kiwify",
      status: "customer",
      notes: `Produto: ${payload.product_name} | Plano: ${planName} | Pedido: ${payload.order_id}`,
    });
  }
}

async function callSyncUser(userId: string, shouldBeActive: boolean) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const response = await fetch(
      `${supabaseUrl}/functions/v1/subscription-whatsapp-groups`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          action: "sync_user",
          user_id: userId,
          should_be_active: shouldBeActive,
        }),
      },
    );
    const result = await response.text();
    console.log("WhatsApp group sync result", result);
  } catch (err: any) {
    console.error("Error calling subscription-whatsapp-groups", err);
  }
}

// deno-lint-ignore no-explicit-any
async function triggerPurchaseAutomation(
  supabase: any,
  organizationId: string,
  email: string,
  payload: KiwifyPayload,
) {
  try {
    // 1. Find the contact in this organization
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", organizationId)
      .ilike("email", email)
      .maybeSingle();

    if (!contact) {
      console.warn(`[triggerPurchaseAutomation] Contact not found for ${email} in org ${organizationId}`);
      return;
    }

    // 2. Find active automations for purchase
    const eventType = payload.order_status === "paid" ? "kiwify_purchase_approved" : "kiwify_subscription_renewed";
    
    const { data: automations } = await supabase
      .from("automations")
      .select("id, name")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .in("trigger_type", [eventType, "purchase_approved"]); // Supporting both names

    if (automations && automations.length > 0) {
      for (const auto of automations) {
        await logStep(supabase, `Triggering purchase automation: ${auto.name}`, {
          automation_id: auto.id,
          event: eventType,
        }, "info", organizationId);

        fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/process-automation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            automation_id: auto.id,
            contact_id: contact.id,
            trigger_event: eventType,
            trigger_data: payload,
          }),
        }).catch(err => console.error("Error dispatching purchase automation:", err));
      }
    }
  } catch (err: any) {
    console.error("Error in triggerPurchaseAutomation:", err);
  }
}

function generatePassword(): string {
  // Simpler password character set to avoid issues with special characters in some contexts
  // and make it easier for users to type/copy
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// deno-lint-ignore no-explicit-any
async function sendWelcomeEmail(
  supabase: any,
  data: {
    email: string;
    name: string;
    password: string;
    planName: string;
    organizationName: string;
  },
) {
  let resendApiKey = Deno.env.get("RESEND_API_KEY");
  let fromAddress = "AG Sell <noreply@agsell.com.br>";

  if (!resendApiKey) {
    const { data: activeIntegration } = await supabase
      .from("organization_integrations")
      .select("config")
      .eq("integration_type", "resend")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const config = activeIntegration?.config as
      | Record<string, string>
      | undefined;
    if (config?.api_key) {
      resendApiKey = config.api_key;
      const fromName = config.from_name || "AG Sell";
      const fromEmail = config.from_email || "noreply@agsell.com.br";
      fromAddress = `${fromName} <${fromEmail}>`;
      await logStep(supabase, "Using Resend API key from active integration");
    }
  }

  if (!resendApiKey) {
    await logStep(
      supabase,
      "No Resend API key available, skipping welcome email",
    );
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [data.email],
        subject: `Bem-vindo ao AG Sell - Suas credenciais de acesso`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8B1538 0%, #5C0F26 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .credentials { background: white; border: 2px solid #8B1538; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .credential-item { margin: 10px 0; }
              .label { color: #666; font-size: 12px; text-transform: uppercase; }
              .value { font-size: 18px; font-weight: bold; color: #8B1538; }
              .button { display: inline-block; background: #8B1538; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎉 Bem-vindo ao AG Sell!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Sua conta foi criada com sucesso</p>
              </div>
              <div class="content">
                <p>Olá <strong>${data.name}</strong>,</p>
                <p>Sua conta no AG Sell foi criada com sucesso! Abaixo estão suas credenciais de acesso:</p>
                <div class="credentials">
                  <div class="credential-item"><div class="label">Organização</div><div class="value">${data.organizationName}</div></div>
                  <div class="credential-item"><div class="label">Plano</div><div class="value">${data.planName}</div></div>
                  <div class="credential-item"><div class="label">E-mail</div><div class="value">${data.email}</div></div>
                  <div class="credential-item"><div class="label">Senha Temporária</div><div class="value" style="font-family: monospace;">${data.password}</div></div>
                </div>
                <p><strong>⚠️ Importante:</strong> Altere sua senha após o primeiro acesso.</p>
                <center><a href="https://agsell.lovable.app/login" class="button">Acessar AG Sell</a></center>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const txt = await response.text();
      await logStep(supabase, "Resend error", txt);
      return;
    }

    await logStep(supabase, "Welcome email sent", { email: data.email });
  } catch (error: any) {
    await logStep(supabase, "Error sending email", error);
  }
}
