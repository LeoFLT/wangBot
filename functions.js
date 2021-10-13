module.exports = {
  parseCmd(cmd, msg, noBackticks) {
    if (noBackticks) {
      const startIndex = msg.indexOf(`${cmd} `, msg.split(/\s/)[0].length) + cmd.length + 1;
      const endIndex = msg.indexOf(' ', startIndex + 1) + 1;
      // endIndex === 0 => no whitespace after startIndex
      const finalStr = msg.slice(startIndex, !endIndex ? undefined : endIndex);
      if (finalStr.startsWith('`') || finalStr.endsWith('`')) return;
      return finalStr.trim();
    }
    const startIndex = msg.indexOf(`${cmd} `, msg.split(/\s/)[0].length) + cmd.length + 1;
    const endIndex = msg.indexOf('`', startIndex + 1) + 1;
    const strNoFilter = msg.slice(
      startIndex,
      !endIndex ? undefined : endIndex,
    );
    if (!strNoFilter.startsWith('`') || !strNoFilter.endsWith('`')) return;
    return strNoFilter.replace(/`/g, '').trim();
  },
  discordTimestamp(dateObj, format) {
    let dateFormat;
    switch (format) {
      case 'isoDate':
        dateFormat = 'd';
        break;
      case 'date':
        dateFormat = 'D';
        break;
      case 'dateTime':
        dateFormat = 'f';
        break;
      case 'weekDayDateTime':
        dateFormat = 'F';
        break;
      case 'time':
        dateFormat = 't';
        break;
      case 'timeLong':
        dateFormat = 'T';
        break;
      case 'timeElapsed':
      default:
        dateFormat = 'R';
        break;
    }
    return `<t:${Math.floor(dateObj ? (dateObj instanceof Date ? dateObj.getTime() / 1000 : typeof dateObj === "number" ? dateObj / 1000 : Date.now() / 1000) : Date.now() / 1000)}:${dateFormat}>`;
  },
};
