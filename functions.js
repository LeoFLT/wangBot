module.exports = {
  parseCmd: (cmd, msg, noBackticks) => {
    if (noBackticks) {
      const startIndex =
        msg.indexOf(`${cmd} `, msg.split(/\s/)[0].length) + cmd.length + 1;
      const endIndex = msg.indexOf(" ", startIndex + 1) + 1;
      // endIndex === 0 => no whitespace after startIndex
      const finalStr = msg.slice(startIndex, !endIndex ? undefined : endIndex);
      if (finalStr.startsWith("`") || finalStr.endsWith("`")) return;
      return finalStr.trim();
    } else {
      const startIndex =
        msg.indexOf(`${cmd} `, msg.split(/\s/)[0].length) + cmd.length + 1;
      const endIndex = msg.indexOf("`", startIndex + 1) + 1;
      const strNoFilter = msg.slice(
        startIndex,
        !endIndex ? undefined : endIndex
      );
      if (!strNoFilter.startsWith("`") || !strNoFilter.endsWith("`")) return;
      return strNoFilter.replace(/`/g, "").trim();
    }
  },
};
