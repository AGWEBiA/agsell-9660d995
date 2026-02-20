

## Remover link "Criar conta" da página de Login

Uma alteracao simples no arquivo `src/pages/Login.tsx`: remover o bloco de texto e link "Nao tem uma conta? Criar conta" do `CardFooter`.

### Detalhe tecnico

No arquivo `src/pages/Login.tsx`, remover as linhas 90-96 que contêm o parágrafo com o link para `/register`:

```tsx
// REMOVER este bloco:
<p className="text-sm text-muted-foreground text-center">
  Não tem uma conta?{' '}
  <Link to="/register" className="text-primary hover:underline">
    Criar conta
  </Link>
</p>
```

O botão "Entrar" permanece inalterado. Nenhuma outra alteração necessária.

