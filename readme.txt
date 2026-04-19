1. Fluxo de Desenvolvimento (Produtividade Máxima)Não precisa de correr o Gradle para cada pequena alteração no React. Faça o seguinte:
1.Inicie o Grails (Backend) no terminal (ou IDE):•Vá para app-timali e rode ./gradlew bootRun.•Este servidor servirá a API na porta 8080.
2.** Inicie o React (Frontend)** num segundo terminal:•Vá para a pasta frontend.
•Rode npm start.•Este servidor servirá a interface na porta 3000 .Como o "Proxy" funciona para si:
•No seu código React, você pede fetch('/produtos').
•O servidor do React (porta 3000) não encontrará essa rota e , por causa do proxy, reencaminhará automaticamente para http://localhost:8080/produtos.
•O React obtém os dados reais do Grails.
•Você tem o benefício do Hot Reload (o React atualiza instantaneamente quando guarda o ficheiro JS).2.Fluxo de Build (Preparação para Deploy / Teste Final)Só precisa de usar o Gradle (o que fizemos no build.gradle) nestes dois momentos:1.Quando quiser testar a integra ção final no monólito.2.Quando for enviar para produção.
