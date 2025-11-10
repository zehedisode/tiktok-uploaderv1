import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-gray-800 rounded-2xl border-2 border-red-600/50 p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-red-600/20 rounded-xl">
                <AlertTriangle size={40} className="text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Bir Hata Oluştu</h1>
                <p className="text-gray-400 mt-1">Uygulama beklenmedik bir hatayla karşılaştı</p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-red-400 mb-2">Hata Detayı:</h2>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <p className="text-red-300 font-mono text-sm">
                    {this.state.error.toString()}
                  </p>
                </div>
              </div>
            )}

            {this.state.errorInfo && (
              <details className="mb-6">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 mb-2">
                  Stack Trace (Geliştiriciler için)
                </summary>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 max-h-64 overflow-y-auto">
                  <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button 
                onClick={this.handleReload}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Uygulamayı Yenile
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Sorun devam ederse lütfen uygulamayı yeniden başlatın
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

