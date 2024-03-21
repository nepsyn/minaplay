// text includes in entry title
const includes = ['1080P', 'HEVC'];
// text excludes in entry title
const excludes = ['Un-Sub'];
const hooks: RuleHooks = {
  validate: (entry) => {
    return includes.every((text) => entry.title.includes(text)) && !excludes.some((text) => entry.title.includes(text));
  },
};
export default hooks;
