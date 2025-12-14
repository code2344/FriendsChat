// List of inappropriate words to filter
const PROFANITY_LIST = [
  'badword1',
  'badword2',
  'inappropriate',
  'offensive',
  // Add more words as needed
];

/**
 * Filter profanity from a message by replacing letters with #
 * @param {string} message - The message to filter
 * @returns {object} - { filteredMessage: string, isFiltered: boolean }
 */
function filterProfanity(message) {
  let filteredMessage = message;
  let isFiltered = false;

  PROFANITY_LIST.forEach(word => {
    const regex = new RegExp(word, 'gi');
    if (regex.test(filteredMessage)) {
      isFiltered = true;
      filteredMessage = filteredMessage.replace(regex, (match) => {
        // Replace letters with # but keep the first letter
        return match[0] + '#'.repeat(match.length - 1);
      });
    }
  });

  return { filteredMessage, isFiltered };
}

module.exports = {
  filterProfanity,
  PROFANITY_LIST
};
