docker exec -it timali_postgres psql -U timali_user -d timali_db

Ação,Comando
Destruir tudo (incluindo dados),docker-compose down -v
Recriar do zero,docker-compose up -d
Ver logs em tempo real,docker-compose logs -f