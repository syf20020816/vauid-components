export const Devices = {
    Microphone: "microphone",
    Camera: "camera",
    ScreenShare: "screenShare",
}
export type Device = (typeof Devices)[keyof typeof Devices]