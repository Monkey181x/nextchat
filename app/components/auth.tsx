import styles from "./auth.module.scss";
import { IconButton } from "./button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Path, SAAS_CHAT_URL } from "../constant";
import { useAccessStore } from "../store";
import Locale from "../locales";
import Delete from "../icons/close.svg";
import Arrow from "../icons/arrow.svg";
import Logo from "../icons/logo.svg";
import { useMobileScreen } from "@/app/utils";
import BotIcon from "../icons/bot.svg";
import { getClientConfig } from "../config/client";
import { PasswordInput } from "./ui-lib";
import LeftIcon from "@/app/icons/left.svg";
import { safeLocalStorage } from "@/app/utils";
import { trackSettingsPageGuideToCPaymentClick } from "../utils/auth-settings-events";
import clsx from "clsx";
import { showToast } from "./ui-lib";

const storage = safeLocalStorage();

export function AuthPage(props: { showReturn?: boolean }) {
  const navigate = useNavigate();
  const accessStore = useAccessStore();
  const authLocale = Locale.Auth as typeof Locale.Auth & {
    Confirming?: string;
    Empty?: string;
    Invalid?: string;
  };
  const [accessCodeInput, setAccessCodeInput] = useState(
    accessStore.accessCode,
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const goChat = () => navigate(Path.Chat);

  async function onConfirm() {
    const accessCode = accessCodeInput.trim();

    if (!accessCode) {
      showToast(authLocale.Empty ?? "请先输入访问码");
      return;
    }

    if (isVerifying) {
      return;
    }

    setIsVerifying(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          accessCode,
        }),
      });

      if (!res.ok) {
        accessStore.update((access) => {
          access.accessCode = "";
          access.accessCodeValidated = false;
        });
        showToast(authLocale.Invalid ?? "访问码错误");
        return;
      }

      accessStore.update((access) => {
        access.accessCode = accessCode;
        access.accessCodeValidated = true;
      });
      goChat();
    } catch {
      showToast(authLocale.Invalid ?? "访问码错误");
    } finally {
      setIsVerifying(false);
    }
  }

  useEffect(() => {
    if (getClientConfig()?.isApp) {
      navigate(Path.Settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles["auth-page"]}>
      <TopBanner></TopBanner>
      {props.showReturn !== false && (
        <div className={styles["auth-header"]}>
          <IconButton
            icon={<LeftIcon />}
            text={Locale.Auth.Return}
            onClick={() => navigate(Path.Home)}
          ></IconButton>
        </div>
      )}
      <div className={clsx("no-dark", styles["auth-logo"])}>
        <BotIcon />
      </div>

      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.Tips}</div>

      <PasswordInput
        style={{ marginTop: "3vh", marginBottom: "3vh" }}
        aria={Locale.Settings.ShowPassword}
        aria-label={Locale.Auth.Input}
        value={accessCodeInput}
        type="text"
        placeholder={Locale.Auth.Input}
        onChange={(e) => {
          setAccessCodeInput(e.currentTarget.value);
        }}
      />

      <div className={styles["auth-actions"]}>
        <IconButton
          text={
            isVerifying
              ? authLocale.Confirming ?? "验证中..."
              : Locale.Auth.Confirm
          }
          type="primary"
          onClick={onConfirm}
          disabled={isVerifying}
        />
      </div>
    </div>
  );
}

function TopBanner() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = useMobileScreen();
  useEffect(() => {
    // 检查 localStorage 中是否有标记
    const bannerDismissed = storage.getItem("bannerDismissed");
    // 如果标记不存在，存储默认值并显示横幅
    if (!bannerDismissed) {
      storage.setItem("bannerDismissed", "false");
      setIsVisible(true); // 显示横幅
    } else if (bannerDismissed === "true") {
      // 如果标记为 "true"，则隐藏横幅
      setIsVisible(false);
    }
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClose = () => {
    setIsVisible(false);
    storage.setItem("bannerDismissed", "true");
  };

  if (!isVisible) {
    return null;
  }
  return (
    <div
      className={styles["top-banner"]}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={clsx(styles["top-banner-inner"], "no-dark")}>
        <Logo className={styles["top-banner-logo"]}></Logo>
        <span>
          {Locale.Auth.TopTips}
          <a
            href={SAAS_CHAT_URL}
            rel="stylesheet"
            onClick={() => {
              trackSettingsPageGuideToCPaymentClick();
            }}
          >
            {Locale.Settings.Access.SaasStart.ChatNow}
            <Arrow style={{ marginLeft: "4px" }} />
          </a>
        </span>
      </div>
      {(isHovered || isMobile) && (
        <Delete className={styles["top-banner-close"]} onClick={handleClose} />
      )}
    </div>
  );
}
