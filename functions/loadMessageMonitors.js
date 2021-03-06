const fs = require("fs-extra-promise");
const path = require("path");

const loadMessageMonitors = (client, baseDir, counts) => new Promise((resolve, reject) => {
  const dir = path.resolve(`${baseDir}./monitors/`);
  fs.ensureDirAsync(dir)
  .then(() => {
    fs.readdirAsync(dir)
    .then((files) => {
      let c = counts;
      try {
        files = files.filter(f => f.slice(-3) === ".js");
        files.forEach((f) => {
          const file = f.split(".");
          const props = require(`${dir}/${f}`);
          client.messageMonitors.set(file[0], props);
          if (props.init) {
            props.init(client);
          }
          c++;
        });
      } catch (e) {
        if (e.code === "MODULE_NOT_FOUND") {
          const module = /'[^']+'/g.exec(e.toString());
          client.funcs.installNPM(module[0].slice(1, -1))
              .then(() => {
                client.funcs.loadMessageMonitors(client);
              })
              .catch((err) => {
                console.error(err);
                process.exit();
              });
        } else {
          reject(e);
        }
      }
      resolve(c);
    }).catch(err => client.funcs.log(err, "error"));
  })
  .catch(err => client.funcs.log(err, "error"));
});

module.exports = (client) => {
  client.messageMonitors.clear();
  const count = 0;
  if (client.coreBaseDir !== client.clientBaseDir) {
    loadMessageMonitors(client, client.coreBaseDir, count).then((counts) => {
      loadMessageMonitors(client, client.clientBaseDir, counts).then((countss) => {
        const c = countss;
        client.funcs.log(`Loaded ${c} command monitors.`);
      });
    });
  } else {
    loadMessageMonitors(client, client.coreBaseDir, count).then((counts) => {
      const c = counts;
      client.funcs.log(`Loaded ${c} command monitors.`);
    });
  }
};
