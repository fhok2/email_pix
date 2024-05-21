const bcrypt = require('bcrypt');

module.exports = {
  async up(db, client) {
    // Cria a coleção de usuários (users) com o esquema correto
    await db.createCollection('users');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });

    // Adiciona um usuário de exemplo (opcional)
    await db.collection('users').insertOne({
      name: "Exemplo",
      email: "exemplo@example.com",
      password: await bcrypt.hash('exemplo123', 10), // Adiciona uma senha criptografada para o usuário exemplo
      createdEmails: [],
      plan: "free",
      paymentDate: new Date(),
      role: "user",
      payments: []
    });

    // Adiciona o campo status aos emails existentes se não existir
    await db.collection('users').updateMany(
      { 'createdEmails.status': { $exists: false } },
      { $set: { 'createdEmails.$[].status': 'active' } }
    );

    // Cria a coleção de pagamentos (payments) com o esquema correto
    await db.createCollection('payments');
    await db.collection('payments').createIndex({ userId: 1 });
  },

  async down(db, client) {
    // Código para reverter as mudanças feitas no método up
    await db.collection('payments').drop();
    await db.collection('users').drop();
  }
};
