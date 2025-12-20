import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Import global styles and Tailwind

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full text-center border-l-4 border-red-500">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">糟糕，發生錯誤了</h1>
                <p className="text-gray-600 mb-4">應用程式遇到預期外的錯誤。</p>
                <div className="bg-gray-100 p-4 rounded text-left overflow-auto text-xs font-mono text-red-600 max-h-40 mb-6">
                    {this.state.error?.toString()}
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition-colors"
                >
                    重新整理頁面
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);