interface Props {
  message: string;
}

export function LoadingState({ message }: Props) {
  return <div className="text-sm text-slate-500">{message}</div>;
}
