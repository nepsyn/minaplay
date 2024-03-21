// replace regexp expression to your own subscription
const regexp = /NO GAME NO LIVE ([\d.]+)([vV]\d+)?/;
const hooks: RuleHooks = {
  validate(entry) {
    return regexp.test(entry.title);
  },
  describe(entry) {
    const groups = entry.title.match(regexp);
    return {
      series: {
        name: 'NO GAME NO LIVE', // name of this series
        season: '01', // season of this series
      },
      episode: {
        title: entry.title,
        no: groups?.[1],
      },
      overwriteEpisode: true,
    };
  },
};
export default hooks;
