module.exports = {
  async up(db, client) {
    // Adiciona o campo 'purpose' aos emails existentes se não existir
    await db.collection('users').updateMany(
      { 'createdEmails.purpose': { $exists: false } },
      { $set: { 'createdEmails.$[].purpose': '' } }
    );

    // Adiciona os novos campos e atualiza o enum 'status'
    await db.collection('users').updateMany(
      {},
      {
        $set: {
          'createdEmails.$[].status': 'active',
          'createdEmails.$[].deletedAt': null
        }
      }
    );

    // Atualiza o schema para incluir o novo valor 'deleted' no enum 'status'
    await db.command({
      collMod: 'users',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['createdEmails'],
          properties: {
            createdEmails: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['status'],
                properties: {
                  status: {
                    enum: ['active', 'inactive', 'deleted']
                  }
                }
              }
            }
          }
        }
      }
    });
  },

  async down(db, client) {
    // Remove o campo 'purpose' dos emails (opcional, mas não recomendado se o campo for necessário)
    await db.collection('users').updateMany(
      { 'createdEmails.purpose': { $exists: true } },
      { $unset: { 'createdEmails.$[].purpose': '' } }
    );

    // Remove os novos campos adicionados
    await db.collection('users').updateMany(
      {},
      {
        $unset: {
          'createdEmails.$[].deletedAt': ''
        },
        $set: {
          'createdEmails.$[].status': 'active'
        }
      }
    );

    // Reverte o schema para remover o valor 'deleted' do enum 'status'
    await db.command({
      collMod: 'users',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['createdEmails'],
          properties: {
            createdEmails: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['status'],
                properties: {
                  status: {
                    enum: ['active', 'inactive']
                  }
                }
              }
            }
          }
        }
      }
    });
  }
};