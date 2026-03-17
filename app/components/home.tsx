"use client";

require("../polyfill");

import { useEffect, useState } from "react";
import styles from "./home.module.scss";

import BotIcon from "../icons/bot.svg";
import LoadingIcon from "../icons/three-dots.svg";

import { getCSSVar, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "./error";

import { getISOLang, getLang } from "../locales";

import {
  HashRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { AuthPage } from "./auth";
import { getClientConfig } from "../config/client";
import { type ClientApi, getClientApi } from "../client/api";
import { useAccessStore, useChatStore } from "../store";
import clsx from "clsx";
import { initializeMcpSystem, isMcpEnabled } from "../mcp/actions";
import { useMaskStore } from "../store/mask";
import { resolveModelConfig } from "../utils/model";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={clsx("no-dark", styles["loading-content"])}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

const Artifacts = dynamic(async () => (await import("./artifacts")).Artifacts, {
  loading: () => <Loading noLogo />,
});

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

const PluginPage = dynamic(async () => (await import("./plugin")).PluginPage, {
  loading: () => <Loading noLogo />,
});

const SearchChat = dynamic(
  async () => (await import("./search-chat")).SearchChatPage,
  {
    loading: () => <Loading noLogo />,
  },
);

const Sd = dynamic(async () => (await import("./sd")).Sd, {
  loading: () => <Loading noLogo />,
});

const McpMarketPage = dynamic(
  async () => (await import("./mcp-market")).McpMarketPage,
  {
    loading: () => <Loading noLogo />,
  },
);

export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

function useHtmlLang() {
  useEffect(() => {
    const lang = getISOLang();
    const htmlLang = document.documentElement.lang;

    if (lang !== htmlLang) {
      document.documentElement.lang = lang;
    }
  }, []);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=" +
    encodeURIComponent("Noto Sans:wght@300;400;700;900") +
    "&display=swap";
  document.head.appendChild(linkEl);
};

export function WindowContent(props: { children: React.ReactNode }) {
  return (
    <div className={styles["window-content"]} id={SlotID.AppBody}>
      {props?.children}
    </div>
  );
}

function Screen() {
  const config = useAppConfig();
  const accessStore = useAccessStore();
  const location = useLocation();
  const isArtifact = location.pathname.includes(Path.Artifacts);
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  const isSd = location.pathname === Path.Sd;
  const isSdNew = location.pathname === Path.SdNew;
  const shouldRequireAccessCode =
    accessStore.enabledAccessControl() && !accessStore.accessCodeValidated;

  const isMobileScreen = useMobileScreen();
  const shouldTightBorder =
    getClientConfig()?.isApp || (config.tightBorder && !isMobileScreen);

  useEffect(() => {
    loadAsyncGoogleFont();
  }, []);

  if (shouldRequireAccessCode) {
    return (
      <div
        className={clsx(styles.container, {
          [styles["tight-container"]]: shouldTightBorder,
          [styles["rtl-screen"]]: getLang() === "ar",
        })}
      >
        <AuthPage showReturn={false} />
      </div>
    );
  }

  if (isArtifact) {
    return (
      <Routes>
        <Route path="/artifacts/:id" element={<Artifacts />} />
      </Routes>
    );
  }
  const renderContent = () => {
    if (isAuth) return <AuthPage />;
    if (isSd) return <Sd />;
    if (isSdNew) return <Sd />;
    return (
      <>
        <SideBar
          className={clsx({
            [styles["sidebar-show"]]: isHome,
          })}
        />
        <WindowContent>
          <Routes>
            <Route path={Path.Home} element={<Chat />} />
            <Route path={Path.NewChat} element={<NewChat />} />
            <Route path={Path.Masks} element={<MaskPage />} />
            <Route path={Path.Plugins} element={<PluginPage />} />
            <Route path={Path.SearchChat} element={<SearchChat />} />
            <Route path={Path.Chat} element={<Chat />} />
            <Route path={Path.Settings} element={<Settings />} />
            <Route path={Path.McpMarket} element={<McpMarketPage />} />
          </Routes>
        </WindowContent>
      </>
    );
  };

  return (
    <div
      className={clsx(styles.container, {
        [styles["tight-container"]]: shouldTightBorder,
        [styles["rtl-screen"]]: getLang() === "ar",
      })}
    >
      {renderContent()}
    </div>
  );
}

export function useLoadData() {
  const config = useAppConfig();

  useEffect(() => {
    const api: ClientApi = getClientApi(config.modelConfig.providerName);

    (async () => {
      const models = await api.llm.models();
      config.mergeModels(models);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.modelConfig.providerName]);
}

function useSyncLockedModel() {
  const accessStore = useAccessStore();
  const config = useAppConfig();

  useEffect(() => {
    if (!accessStore.fixedModel) {
      return;
    }

    const resolvedModel = resolveModelConfig(
      config.models,
      [config.customModels, accessStore.customModels].join(","),
      accessStore.fixedModel,
    );

    if (!resolvedModel) {
      return;
    }

    const expectedModel = resolvedModel.model;
    const expectedProvider = resolvedModel.providerName;

    const syncModelConfig = (modelConfig: typeof config.modelConfig) => {
      modelConfig.model = expectedModel as typeof modelConfig.model;
      modelConfig.providerName =
        expectedProvider as typeof modelConfig.providerName;
      modelConfig.compressModel =
        expectedModel as typeof modelConfig.compressModel;
      modelConfig.compressProviderName =
        expectedProvider as typeof modelConfig.compressProviderName;
    };

    const isModelConfigSynced = (modelConfig: typeof config.modelConfig) =>
      modelConfig.model === expectedModel &&
      modelConfig.providerName === expectedProvider &&
      modelConfig.compressModel === expectedModel &&
      modelConfig.compressProviderName === expectedProvider;

    if (!isModelConfigSynced(config.modelConfig)) {
      useAppConfig.getState().update((state) => {
        syncModelConfig(state.modelConfig);
      });
    }

    const chatStore = useChatStore.getState();
    const hasUnsyncedSessions = chatStore.sessions.some(
      (session) =>
        !session.mask.syncGlobalConfig ||
        !isModelConfigSynced(session.mask.modelConfig),
    );

    if (hasUnsyncedSessions) {
      chatStore.update((state) => {
        state.sessions.forEach((session) => {
          syncModelConfig(session.mask.modelConfig);
          session.mask.syncGlobalConfig = true;
        });
      });
    }

    const maskStore = useMaskStore.getState();
    const hasUnsyncedMasks = Object.values(maskStore.masks).some(
      (mask) =>
        !mask.syncGlobalConfig || !isModelConfigSynced(mask.modelConfig),
    );

    if (hasUnsyncedMasks) {
      maskStore.update((state) => {
        Object.values(state.masks).forEach((mask) => {
          syncModelConfig(mask.modelConfig);
          mask.syncGlobalConfig = true;
        });
      });
    }
  }, [
    accessStore.customModels,
    accessStore.fixedModel,
    config.customModels,
    config.models,
  ]);
}

export function Home() {
  useSwitchTheme();
  useLoadData();
  useSyncLockedModel();
  useHtmlLang();

  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
    useAccessStore.getState().fetch();

    const initMcp = async () => {
      try {
        const enabled = await isMcpEnabled();
        if (enabled) {
          console.log("[MCP] initializing...");
          await initializeMcpSystem();
          console.log("[MCP] initialized");
        }
      } catch (err) {
        console.error("[MCP] failed to initialize:", err);
      }
    };
    initMcp();
  }, []);

  if (!useHasHydrated()) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}
