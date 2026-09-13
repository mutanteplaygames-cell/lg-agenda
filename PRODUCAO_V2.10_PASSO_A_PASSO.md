# Produção V2.10

1. Não há migration SQL nova.
2. Na Vercel, confirme `NEXT_PUBLIC_SITE_URL=https://lg-agenda.vercel.app` enquanto o domínio próprio ainda não estiver conectado.
3. Faça deploy da V2.10.
4. Gere um checkout NOVO. Preferências antigas do Mercado Pago continuam guardando as URLs antigas com as quais foram criadas.
5. Faça um pagamento teste/real controlado e confirme:
   - aprovado -> `/payment/return` -> onboarding/admin;
   - botão Voltar para a loja -> `https://lg-agenda.vercel.app/...`;
   - login posterior concilia pagamento e continua;
   - link público `/agenda/<slug>` abre normalmente.
6. Quando houver domínio próprio, altere `NEXT_PUBLIC_SITE_URL` para ele e atualize Supabase/Mercado Pago/WhatsApp conforme checklist final.
