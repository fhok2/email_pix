module.exports = {
  async up(db, client) {
    // Adiciona o campo 'purpose' aos emails existentes se não existir
    await db.collection('users').updateMany(
      { 'createdEmails.purpose': { $exists: false } },
      { $set: { 'createdEmails.$[].purpose': '' } }
    );
  },

  async down(db, client) {
    // Remove o campo 'purpose' dos emails (opcional, mas não recomendado se o campo for necessário)
    await db.collection('users').updateMany(
      { 'createdEmails.purpose': { $exists: true } },
      { $unset: { 'createdEmails.$[].purpose': '' } }
    );
  }
};
