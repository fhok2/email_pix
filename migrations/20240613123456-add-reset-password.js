module.exports = {
  async up(db, client) {
    // Adiciona os campos 'resetPasswordToken' e 'resetPasswordExpires' aos documentos da coleção 'users'
    await db.collection('users').updateMany(
      { resetPasswordToken: { $exists: false } },
      { $set: { resetPasswordToken: null, resetPasswordExpires: null } }
    );
  },

  async down(db, client) {
    // Remove os campos 'resetPasswordToken' e 'resetPasswordExpires' dos documentos da coleção 'users'
    await db.collection('users').updateMany(
      { resetPasswordToken: { $exists: true } },
      { $unset: { resetPasswordToken: "", resetPasswordExpires: "" } }
    );
  }
};
