/**
 * Gender Detection Utility
 * 
 * Why: Determine gender from name for avatar assignment
 * How: Uses common name patterns and gender databases
 * Impact: Assigns appropriate avatars based on gender
 */

// Common male and female name patterns
// This is a simple heuristic - in production, you might want to use a more sophisticated library
const maleNames = new Set([
  'james', 'john', 'robert', 'michael', 'william', 'david', 'richard', 'joseph', 'thomas', 'charles',
  'christopher', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua',
  'kenneth', 'kevin', 'brian', 'george', 'timothy', 'ronald', 'jason', 'edward', 'jeffrey', 'ryan',
  'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon',
  'benjamin', 'samuel', 'frank', 'gregory', 'raymond', 'alexander', 'patrick', 'jack', 'dennis', 'jerry',
  'tyler', 'aaron', 'jose', 'henry', 'adam', 'douglas', 'nathan', 'zachary', 'peter', 'kyle',
  'noah', 'ethan', 'jeremy', 'walter', 'christian', 'keith', 'roger', 'terry', 'austin', 'sean',
  'gerald', 'carl', 'harold', 'dylan', 'arthur', 'lawrence', 'jordan', 'jesse', 'bryan', 'billy',
  'bruce', 'gabriel', 'logan', 'albert', 'ralph', 'roy', 'juan', 'wayne', 'eugene', 'louis',
  'russell', 'bobby', 'victor', 'johnny', 'philip', 'ramesh', 'raj', 'amit', 'suresh', 'kumar',
  'vijay', 'anil', 'sanjay', 'manoj', 'prakash', 'ashok', 'sandeep', 'rohit', 'nitin', 'deepak',
  'alex', 'chris', 'mike', 'tom', 'joe', 'sam', 'dan', 'nick', 'jake', 'luke',
  'ryan', 'max', 'leo', 'noah', 'ethan', 'mason', 'logan', 'lucas', 'jackson', 'aiden'
])

const femaleNames = new Set([
  'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'sarah', 'karen',
  'nancy', 'lisa', 'betty', 'margaret', 'sandra', 'ashley', 'kimberly', 'emily', 'donna', 'michelle',
  'dorothy', 'carol', 'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'laura', 'cynthia',
  'kathleen', 'amy', 'shirley', 'angela', 'helen', 'anna', 'brenda', 'pamela', 'nicole', 'emma',
  'samantha', 'katherine', 'christine', 'debra', 'rachel', 'carolyn', 'janet', 'virginia', 'maria', 'heather',
  'diane', 'julie', 'joyce', 'victoria', 'kelly', 'christina', 'joan', 'evelyn', 'judith', 'megan',
  'cheryl', 'andrea', 'hannah', 'jacqueline', 'martha', 'gloria', 'teresa', 'sara', 'janice', 'marie',
  'julia', 'grace', 'judy', 'theresa', 'madison', 'beverly', 'denise', 'marilyn', 'amber', 'danielle',
  'brittany', 'diana', 'abigail', 'jane', 'lori', 'alice', 'helen', 'sandra', 'donna', 'nancy',
  'priya', 'kavita', 'anita', 'sunita', 'meera', 'radha', 'sita', 'geeta', 'neha', 'pooja',
  'divya', 'shreya', 'aishwarya', 'deepika', 'kiran', 'swati', 'ritu', 'anjali', 'manisha', 'rashmi',
  'sophia', 'olivia', 'isabella', 'ava', 'mia', 'charlotte', 'amelia', 'harper', 'evelyn', 'abigail',
  'emily', 'ella', 'elizabeth', 'camila', 'luna', 'sofia', 'avery', 'scarlett', 'victoria', 'aria'
])

/**
 * Detect gender from name
 * Why: Assign appropriate avatar based on gender
 * How: Checks name against common male/female name patterns
 * Impact: Users get gender-appropriate avatars
 */
function detectGenderFromName(name) {
  if (!name) return 'male' // Default to male if name not provided
  
  // Extract first name
  const firstName = name.trim().toLowerCase().split(' ')[0]
  
  // Check against name sets
  if (maleNames.has(firstName)) {
    return 'male'
  }
  if (femaleNames.has(firstName)) {
    return 'female'
  }
  
  // Default to male if uncertain
  return 'male'
}

/**
 * Get random avatar based on gender
 * Why: Assign avatar from appropriate gender category
 * How: Randomly selects from male (1-12) or female (13-18) avatars
 * Impact: Users get diverse avatar assignments
 */
function getRandomAvatarByGender(gender) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
  
  if (gender === 'female') {
    // Female avatars: 13-18
    const avatarNumber = Math.floor(Math.random() * 6) + 13
    return `${backendUrl}/api/avatars/avatar_${avatarNumber}.jpg`
  } else {
    // Male avatars: 1-12
    const avatarNumber = Math.floor(Math.random() * 12) + 1
    return `${backendUrl}/api/avatars/avatar_${avatarNumber}.jpg`
  }
}

module.exports = {
  detectGenderFromName,
  getRandomAvatarByGender,
}
