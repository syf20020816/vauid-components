import type { FC, SVGProps } from "react";
import {
  ChevronRight,
  LogOut,
  Mic,
  Volume2,
  MonitorUp,
  Plus,
  User,
  MicOff,
  Focus,
  Hand,
  Maximize,
  Minimize,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  SignalZero,
  Upload,
  Download,
  Video,
  VideoOff,
  UserRoundPlus,
  Link,
  UsersRound,
} from "lucide-react";

type IconComponent = FC<SVGProps<SVGSVGElement>> & {
  Arrow: FC<SVGProps<SVGSVGElement>>;
  Leave: FC<SVGProps<SVGSVGElement>>;
  Microphone: FC<SVGProps<SVGSVGElement>>;
  MicrophoneOff: FC<SVGProps<SVGSVGElement>>;
  Volume: FC<SVGProps<SVGSVGElement>>;
  Camera: FC<SVGProps<SVGSVGElement>>;
  ScreenShare: FC<SVGProps<SVGSVGElement>>;
  Add: FC<SVGProps<SVGSVGElement>>;
  User: FC<SVGProps<SVGSVGElement>>;
  MicOff: FC<SVGProps<SVGSVGElement>>;
  CameraOff: FC<SVGProps<SVGSVGElement>>;
  Focus: FC<SVGProps<SVGSVGElement>>;
  Hand: FC<SVGProps<SVGSVGElement>>;
  FullScreen: FC<SVGProps<SVGSVGElement>>;
  FullScreenExit: FC<SVGProps<SVGSVGElement>>;
  Signal: FC<SVGProps<SVGSVGElement>>;
  SignalHigh: FC<SVGProps<SVGSVGElement>>;
  SignalMedium: FC<SVGProps<SVGSVGElement>>;
  SignalLow: FC<SVGProps<SVGSVGElement>>;
  SignalZero: FC<SVGProps<SVGSVGElement>>;
  Upload: FC<SVGProps<SVGSVGElement>>;
  Download: FC<SVGProps<SVGSVGElement>>;
  Users: FC<SVGProps<SVGSVGElement>>;
  Invite: FC<SVGProps<SVGSVGElement>>;
  Link: FC<SVGProps<SVGSVGElement>>;
};

const defaultProps: Partial<SVGProps<SVGSVGElement>> = {
  width: 16,
  height: 16,
};

const BaseIcon: IconComponent = (props) => (
  <User {...defaultProps} {...props} />
);

BaseIcon.Arrow = (props) => <ChevronRight {...defaultProps} {...props} />;
BaseIcon.Leave = (props) => <LogOut {...defaultProps} {...props} />;
BaseIcon.Microphone = (props) => <Mic {...defaultProps} {...props} />;
BaseIcon.MicrophoneOff = (props) => <MicOff {...defaultProps} {...props} />;
BaseIcon.Volume = (props) => <Volume2 {...defaultProps} {...props} />;
BaseIcon.Camera = (props) => <Video {...defaultProps} {...props} />;
BaseIcon.ScreenShare = (props) => <MonitorUp {...defaultProps} {...props} />;
BaseIcon.Add = (props) => <Plus {...defaultProps} {...props} />;
BaseIcon.User = (props) => <User {...defaultProps} {...props} />;
BaseIcon.MicOff = (props) => <MicOff {...defaultProps} {...props} />;
BaseIcon.CameraOff = (props) => <VideoOff {...defaultProps} {...props} />;
BaseIcon.Focus = (props) => <Focus {...defaultProps} {...props} />;
BaseIcon.Hand = (props) => <Hand {...defaultProps} {...props} />;
BaseIcon.FullScreen = (props) => <Maximize {...defaultProps} {...props} />;
BaseIcon.FullScreenExit = (props) => <Minimize {...defaultProps} {...props} />;
BaseIcon.Signal = (props) => <Signal {...defaultProps} {...props} />;
BaseIcon.SignalHigh = (props) => <SignalHigh {...defaultProps} {...props} />;
BaseIcon.SignalMedium = (props) => (
  <SignalMedium {...defaultProps} {...props} />
);
BaseIcon.SignalLow = (props) => <SignalLow {...defaultProps} {...props} />;
BaseIcon.SignalZero = (props) => <SignalZero {...defaultProps} {...props} />;
BaseIcon.Upload = (props) => <Upload {...defaultProps} {...props} />;
BaseIcon.Download = (props) => <Download {...defaultProps} {...props} />;
BaseIcon.Users = (props) => <UsersRound {...defaultProps} {...props} />;
BaseIcon.Invite = (props) => <UserRoundPlus {...defaultProps} {...props} />;
BaseIcon.Link = (props) => <Link {...defaultProps} {...props} />;


export { BaseIcon as Icon };
