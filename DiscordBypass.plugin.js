/**
 * @name DiscordBypass
 * @author Ahlawat
 * @authorId 887483349369765930
 * @version 1.1.1
 * @invite SgKSKyh9gY
 * @description A Collection of patches into one, Check plugin settings for features.
 * @website https://tharki-god.github.io/
 * @source https://github.com/Tharki-God/BetterDiscordPlugins
 * @updateUrl https://raw.githubusercontent.com/Tharki-God/BetterDiscordPlugins/master/DiscordBypass.plugin.js
 */
/*@cc_on
	@if (@_jscript)
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
	shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
	shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
	fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
	// Show the user where to put plugins in the future
	shell.Exec("explorer " + pathPlugins);
	shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();
@else@*/
module.exports = (() => {
  const config = {
    info: {
      name: "DiscordBypass",
      authors: [
        {
          name: "Ahlawat",
          discord_id: "887483349369765930",
          github_username: "Tharki-God",
        },
      ],
      version: "1.1.1",
      description:
        "A Collection of patches into one, Check plugin settings for features.",
      github: "https://github.com/Tharki-God/BetterDiscordPlugins",
      github_raw:
        "https://raw.githubusercontent.com/Tharki-God/BetterDiscordPlugins/master/DiscordBypass.plugin.js",
    },
    changelog: [
      {
        title: "v0.0.1",
        items: ["Idea in mind"],
      },
      {
        title: "v0.0.5",
        items: ["Base Model"],
      },
      {
        title: "Initial Release v1.0.0",
        items: [
          "This is the initial release of the plugin :)",
          "I :3 wannya *looks at you* cuddwe w-w-with my fiancee :3 (p≧w≦q)",
        ],
      },
      {
        title: "v1.0.1",
        items: ["Infinity account in account switcher"],
      },
      {
        title: "v1.0.7",
        items: ["Added option to stop your stream preview from posting"],
      },
      {
        title: "v1.0.8",
        items: ["Added Discord Experiments"],
      },
      {
        title: "v1.1.1",
        items: [
          "Added Spotify Listen Along without premium.",
          "Fixed Setting items not updating on click.",
        ],
      },
    ],
    main: "DiscordBypass.plugin.js",
  };
  return !global.ZeresPluginLibrary
    ? class {
        constructor() {
          this._config = config;
        }
        getName() {
          return config.info.name;
        }
        getAuthor() {
          return config.info.authors.map((a) => a.name).join(", ");
        }
        getDescription() {
          return config.info.description;
        }
        getVersion() {
          return config.info.version;
        }
        load() {
          BdApi.showConfirmationModal(
            "Library Missing",
            `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`,
            {
              confirmText: "Download Now",
              cancelText: "Cancel",
              onConfirm: () => {
                require("request").get(
                  "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
                  async (error, response, body) => {
                    if (error) {
                      return BdApi.showConfirmationModal("Error Downloading", [
                        "Library plugin download failed. Manually install plugin library from the link below.",
                        BdApi.React.createElement(
                          "a",
                          {
                            href: "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
                            target: "_blank",
                          },
                          "ZeresPluginLibrary"
                        ),
                      ]);
                    }
                    await new Promise((r) =>
                      require("fs").writeFile(
                        require("path").join(
                          BdApi.Plugins.folder,
                          "0PluginLibrary.plugin.js"
                        ),
                        body,
                        r
                      )
                    );
                  }
                );
              },
            }
          );
        }
        start() {}
        stop() {}
      }
    : (([Plugin, Library]) => {
        const {
          WebpackModules,
          Utilities,
          Logger,
          PluginUpdater,
          Patcher,
          Settings: { SettingPanel, Switch },
          DiscordModules: {
            CurrentUserIdle,
            UserStore,
            DiscordConstants,
            ExperimentsManager,
            DeviceStore,
            Dispatcher,
          },
        } = Library;
        const { Timeout } = WebpackModules.getByProps("Timeout");
        const GuildVerificationStore = WebpackModules.getByProps(
          "AppliedGuildBoostsRequiredForBoostedGuildTier"
        );
        const ChannelPermissionStore = WebpackModules.getByProps(
          "getChannelPermissions"
        );
        const AccountSwitcher = WebpackModules.getByProps("MAX_ACCOUNTS");
        const postRequests = WebpackModules.getByProps("makeChunkedRequest");
        const isSpotifyPremium = WebpackModules.getByProps("isSpotifyPremium");
        return class DiscordBypass extends Plugin {
          constructor() {
            super();
            this.NSFW = Utilities.loadData(
              config.info.name,
              "NSFW",
              !UserStore.getCurrentUser().nsfwAllowed
            );
            this.verification = Utilities.loadData(
              config.info.name,
              "verification",
              true
            );
            this.noTimeout = Utilities.loadData(
              config.info.name,
              "noTimeout",
              true
            );
            this.ptt = Utilities.loadData(config.info.name, "ptt", true);
            this.idle = Utilities.loadData(config.info.name, "idle", true);
            this.accounts = Utilities.loadData(
              config.info.name,
              "accounts",
              true
            );
            this.preview = Utilities.loadData(
              config.info.name,
              "preview",
              true
            );
            this.dcExp = Utilities.loadData(config.info.name, "dcExp", true);
            this.spotify = Utilities.loadData(
              config.info.name,
              "spotify",
              true
            );
          }
          checkForUpdates() {
            try {
              PluginUpdater.checkForUpdate(
                config.info.name,
                config.info.version,
                config.info.github_raw
              );
            } catch (err) {
              Logger.err("Plugin Updater could not be reached.", err);
            }
          }
          async onStart() {
            this.checkForUpdates();
            this.initialize();
          }
          initialize() {
            if (this.NSFW) this.nsfw();
            if (this.verification) this.verify(true);
            if (this.noTimeout) this.bandwidth();
            if (this.ptt) this.noPTT();
            if (this.idle) this.noIdle();
            if (this.accounts) this.maxAccount(true);
            if (this.accounts) this.maxAccount(true);
            if (this.preview) this.patchStream();
            if (this.dcExp) this.experiment(true);
            if (this.spotify) this.patchSpotify();
          }
          patchStream() {
            Patcher.instead(
              postRequests,
              "makeChunkedRequest",
              (_, args, res) => {
                if (!args[0].includes("preview") && !args[2].method == "POST") {
                  res();
                }
              }
            );
          }
          maxAccount(toggle) {
            AccountSwitcher.MAX_ACCOUNTS = toggle ? Infinity : 5;
          }
          noPTT() {
            Patcher.after(ChannelPermissionStore, "can", (_, args, res) => {
              if (args[0] == DiscordConstants.Permissions.USE_VAD) {
                return true;
              }
              return res;
            });
          }
          bandwidth() {
            Patcher.after(Timeout.prototype, "start", (timeout, [_, args]) => {
              if (args?.toString().includes("BOT_CALL_IDLE_DISCONNECT")) {
                timeout.stop();
              }
            });
          }
          noIdle() {
            Patcher.instead(CurrentUserIdle, "getIdleSince", (_, args, res) => {
              return null;
            });
            Patcher.instead(CurrentUserIdle, "isIdle", (_, args, res) => {
              return false;
            });
            Patcher.instead(CurrentUserIdle, "isAFK", (_, args, res) => {
              return false;
            });
          }
          verify(toggle) {
            GuildVerificationStore.VerificationCriteria = toggle
              ? {
                  ACCOUNT_AGE: 0,
                  MEMBER_AGE: 0,
                }
              : {
                  ACCOUNT_AGE: 5,
                  MEMBER_AGE: 10,
                };
          }
          nsfw() {
            Patcher.after(UserStore, "getCurrentUser", (_, args, res) => {
              if (!res?.nsfwAllowed && res?.nsfwAllowed !== undefined) {
                res.nsfwAllowed = true;
              }
            });
          }
          experiment(toogle) {
            const nodes = Object.values(
              ExperimentsManager._dispatcher._actionHandlers._dependencyGraph
                .nodes
            );
            if (toogle) {
              try {
                nodes
                  .find((x) => x.name == "ExperimentStore")
                  .actionHandler["OVERLAY_INITIALIZE"]({
                    user: { flags: 1 },
                    type: "CONNECTION_OPEN",
                  });
              } catch (err) {
                Logger.err(err);
              }
              const oldGetUser = UserStore.getCurrentUser;
              UserStore.getCurrentUser = () => ({
                hasFlag: () => true,
              });
              nodes
                .find((x) => x.name == "DeveloperExperimentStore")
                .actionHandler["OVERLAY_INITIALIZE"]();
              UserStore.getCurrentUser = oldGetUser;
            } else {
              try {
                nodes
                  .find((x) => x.name == "ExperimentStore")
                  .actionHandler["OVERLAY_INITIALIZE"]({
                    user: { flags: 0 },
                    type: "CONNECTION_OPEN",
                  });
              } catch (err) {
                Logger.err(err);
              }
            }
          }
          patchSpotify() {
            Patcher.instead(DeviceStore, "getProfile", (_, [id, t]) =>
              Dispatcher.dispatch({
                type: "SPOTIFY_PROFILE_UPDATE",
                accountId: id,
                isPremium: true,
              })
            );
            Patcher.instead(isSpotifyPremium, "isSpotifyPremium", () => true);
          }
          onStop() {
            Patcher.unpatchAll();
            this.verify(false);
            this.experiment(false);
          }
          getSettingsPanel() {
            return SettingPanel.build(
              this.saveSettings.bind(this),
              new Switch(
                "NSFW Bypass",
                "Bypass NSFW Age restriction",
                this.NSFW,
                (e) => {
                  this.NSFW = e;
                },
                {
                  disabled: UserStore.getCurrentUser().nsfwAllowed,
                }
              ),
              new Switch(
                "Verification Bypass",
                "Disable wait for 10 mins to join vc in new servers",
                this.verification,
                (e) => {
                  this.verification = e;
                }
              ),
              new Switch(
                "Call Timeout",
                "Let you stay alone in call for more than 5 mins.",
                this.noTimeout,
                (e) => {
                  this.noTimeout = e;
                }
              ),
              new Switch(
                "No Push to talk",
                "Let you use voice Activity in push to talk only channels.",
                this.ptt,
                (e) => {
                  this.ptt = e;
                }
              ),
              new Switch(
                "No AFK",
                "Stops Discord from setting your presense to idle and Probably no afk in vc too.",
                this.idle,
                (e) => {
                  this.idle = e;
                }
              ),
              new Switch(
                "Maximum Account",
                "Add Unlimited Account in discord account switcher.",
                this.accounts,
                (e) => {
                  this.accounts = e;
                }
              ),
              new Switch(
                "Stop Stream Preview",
                "Stop stream preview to be rendered for others.",
                this.preview,
                (e) => {
                  this.preview = e;
                }
              ),
              new Switch(
                "Discord Experiments",
                "Enable discord experiments tab and shit.",
                this.dcExp,
                (e) => {
                  this.dcExp = e;
                }
              ),
              new Switch(
                "Spotify Listen Along",
                "Enables Spotify Listen Along feature on Discord without Premium.",
                this.spotify,
                (e) => {
                  this.spotify = e;
                }
              )
            );
          }
          saveSettings() {
            Utilities.saveData(config.info.name, "NSFW", this.NSFW);
            Utilities.saveData(
              config.info.name,
              "verification",
              this.verification
            );
            Utilities.saveData(config.info.name, "noTimeout", this.noTimeout);
            Utilities.saveData(config.info.name, "ptt", this.ptt);
            Utilities.saveData(config.info.name, "idle", this.idle);
            Utilities.saveData(config.info.name, "accounts", this.accounts);
            Utilities.saveData(config.info.name, "preview", this.preview);
            Utilities.saveData(config.info.name, "dcExp", this.dcExp);
            Utilities.saveData(config.info.name, "spotify", this.spotify);
            this.stop();
            this.initialize();
          }
        };
        return plugin(Plugin, Library);
      })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
