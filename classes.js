module.exports = {
  RoleList: class extends Map {
    addRole(reaction, obj) {
      if (!this.get(reaction)) { this.set(reaction, obj); }
    }

    toArray() {
      const roleArr = [];
      this.forEach((val) => val?.id && roleArr.push(val.id));
      return roleArr;
    }

    concatReactions() {
      const roleArr = [];
      this.forEach((_, k) => roleArr.push(k));
      return roleArr;
    }

    concatIDs() {
      const roleArr = [];
      this.forEach((val) => (val?.id ? roleArr.push(`<@&${val.id}>`) : undefined));
      return roleArr;
    }

    joinReactions(delimiter) {
      return this.concatReactions().join(delimiter);
    }

    joinIDs(delimiter) {
      return this.concatIDs().join(delimiter);
    }
  },
};
