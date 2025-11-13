import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): State {
    const message =
      (error && (error.message || error.toString?.())) ||
      "An unexpected error occurred.";
    return { hasError: true, message };
  }

  componentDidCatch(error: any, info: any) {
    console.error("UI ErrorBoundary caught error:", error, info);
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center" }}>
          <h2>Something went wrong</h2>
          <p>{this.state.message}</p>
          <button onClick={this.handleReload}>Reload page</button>
        </div>
      );
    }
    return this.props.children;
  }
}
