UPDATE organization_integrations 
SET config = jsonb_set(config::jsonb, '{instance_name}', '"Suporte"')
WHERE id = '048aa620-6e38-4f41-bf57-779fb476537b';