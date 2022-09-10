import styles from "./room.module.scss";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ClientVideo, Controls, RemoteUsers, ScreenShare } from "@components";
import { RoomContextProvider } from "@context";
import { useAppDispatch, useAppSelector, useError } from "@utils/hooks";
import { rearCameraIsAvailable, resetState, screenSharingIsAvailable } from "@store";
import { api } from "@services";

export const Room = () => {
  const navigate = useNavigate();
  const [_, setError] = useError();
  const dispatch = useAppDispatch();
  const roomId = sessionStorage.getItem("roomId");
  const username = sessionStorage.getItem("username");
  const screenUsername = `${username}'s screen`;
  const isVideoOn = useAppSelector((state) => state.room.isVideoOn);
  const isMicOn = useAppSelector((state) => state.room.isMicOn);
  const isSharingScreen = useAppSelector((state) => state.room.isSharingScreen);
  const facingMode = useAppSelector((state) => state.room.facingMode);
  const { current: client } = useRef(AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));

  const checkDeviceCapabilities = async () => {
    try {
      if ("getDisplayMedia" in navigator.mediaDevices) {
        dispatch(screenSharingIsAvailable());
      } else {
        console.info("💻 Screensharing is not available on this device.");
      }
      const tracks = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } },
        audio: false,
      });
      tracks.getVideoTracks().forEach((track) => {
        track.stop();
      });
      dispatch(rearCameraIsAvailable());
    } catch (err) {
      console.info("📷 Rear camera is not available on this device.");
    }
  };

  const enterRoom = async () => {
    try {
      if (roomId && username) {
        const response = await api.getAccessToken(roomId, username);
        const { appId, uid, accessToken } = await response.json();
        await client.join(appId, roomId, accessToken, uid);
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error(err);
        setError(err.message);
      }
    }
  };

  const askForConfirmation = () => false;

  useEffect(() => {
    checkDeviceCapabilities().then(() => {
      if (client.connectionState !== "CONNECTED" && client.connectionState !== "CONNECTING") {
        enterRoom();
      }
    });
    window.addEventListener("beforeunload", askForConfirmation);

    return () => {
      client.leave();
      console.clear();
      dispatch(resetState());
      window.removeEventListener("beforeunload", askForConfirmation);
    };
  }, []);

  useLayoutEffect(() => {
    if (!roomId || !username) {
      navigate(-1);
    }
  }, []);

  return (
    <>
      {roomId && username && (
        <RoomContextProvider value={{ roomId, username, screenUsername, client }}>
          <div className={styles.room}>
            <div className={styles.userGrid}>
              {isSharingScreen && <ScreenShare />}
              <ClientVideo isVideoOn={isVideoOn} isMicOn={isMicOn} facingMode={facingMode} />
              <RemoteUsers />
            </div>
            <Controls />
          </div>
        </RoomContextProvider>
      )}
    </>
  );
};
