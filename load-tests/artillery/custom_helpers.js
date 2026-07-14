const crypto = require('crypto');

// Generate random participant credentials
function generateParticipantData(userContext, events, done) {
  const rand = crypto.randomBytes(4).toString('hex');
  userContext.vars.name = `User_${rand}`;
  userContext.vars.email = `user_${rand}@test.com`;
  userContext.vars.college = 'Microsoft Student Club Academy';
  return done();
}

// Generate random answer option and response time (20-30s)
function generateAnswerData(userContext, events, done) {
  const options = ['A', 'B', 'C', 'D'];
  userContext.vars.selectedAnswer = options[Math.floor(Math.random() * options.length)];
  // Random time between 20,000 and 30,000 milliseconds (20-30 seconds)
  userContext.vars.responseTime = Math.floor(Math.random() * 10000) + 20000;
  return done();
}

module.exports = {
  generateParticipantData,
  generateAnswerData,
};
