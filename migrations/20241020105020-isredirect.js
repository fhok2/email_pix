// migrations/<timestamp>-add-isRedirect-isTemporary-fields.js

const { MongoClient } = require('mongodb');

module.exports = {
  async up(db, client) {
    // Adicionar os campos isRedirect e isTemporary aos documentos existentes
    await db.collection('users').updateMany(
      { "createdEmails.isRedirect": { $exists: false } }, // Seleciona documentos que ainda não têm o campo isRedirect
      { $set: { "createdEmails.$[].isRedirect": true, "createdEmails.$[].isTemporary": false } } // Adiciona os campos com os valores padrão
    );
  },

  async down(db, client) {
    // Remover os campos isRedirect e isTemporary dos documentos
    await db.collection('users').updateMany(
      { "createdEmails.isRedirect": { $exists: true } },
      { $unset: { "createdEmails.$[].isRedirect": "", "createdEmails.$[].isTemporary": "" } }
    );
  }
};
