module.exports = {
  async up(db, client) {
    // Adiciona os novos campos a todos os documentos de usuário existentes
    await db.collection('users').updateMany(
      {},
      {
        $set: {
          emailVerification: {
            token: null,
            createdAt: null,
            verified: true
          },
          emailVerified: true
        }
      }
    );

    // Cria um índice TTL (Time-To-Live) para o campo createdAt em emailVerification
    // Isso fará com que o token expire automaticamente após 1 hora
    await db.collection('users').createIndex(
      { "emailVerification.createdAt": 1 },
      { expireAfterSeconds: 3600 } // 1 hora = 3600 segundos
    );

    console.log('Migration para adicionar campos de verificação de e-mail concluída com sucesso');
  },

  async down(db, client) {
    // Remove os novos campos de todos os documentos de usuário
    await db.collection('users').updateMany(
      {},
      {
        $unset: {
          emailVerification: "",
          emailVerified: ""
        }
      }
    );

    // Remove o índice TTL criado para emailVerification.createdAt
    await db.collection('users').dropIndex("emailVerification.createdAt_1");

    console.log('Rollback da migration de verificação de e-mail concluído');
  }
};