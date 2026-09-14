# LG Agenda V2.11 — Multi-segmento

## Antes do deploy
1. Abra o Supabase > SQL Editor.
2. Execute uma vez o arquivo `supabase/migration-v2.11-multi-segment.sql`.
3. Confirme que a coluna `business_type` apareceu na tabela `businesses`.

## Deploy
```bash
git add .
git commit -m "LG Agenda V2.11 multi segmento"
git push
```

## Teste rápido
- Abra a página inicial e confira a comunicação para vários segmentos.
- Crie uma conta e confirme que o onboarding pergunta o tipo de negócio.
- Entre no painel > Estabelecimento e altere o tipo de negócio.
- Vá em Serviços > + Categoria e confirme que os exemplos mudam conforme o segmento.
- Confira que os envios de WhatsApp continuam apenas manuais.
