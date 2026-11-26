import React from 'react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Terjadi kesalahan pada aplikasi.',
    };
  }

  render() {
    if (this.state.hasError) {
      let parsedDetail: { error?: string; operationType?: string; path?: string } | null = null;
      try {
        parsedDetail = JSON.parse(this.state.errorMessage);
      } catch {
        parsedDetail = null;
      }

      return (
        <div className="min-h-screen bg-[#0E1E38] flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 p-8 shadow-lg">
            <h1 className="text-xl font-bold text-slate-900">Kendala Sinkronisasi Sistem</h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Aplikasi mendeteksi gangguan akses data atau konfigurasi. Silakan muat ulang halaman atau periksa izin akun Anda.
            </p>
            <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs font-mono text-slate-700 break-words">
              {parsedDetail ? (
                <div className="space-y-1">
                  <div>Operasi: {parsedDetail.operationType || '-'}</div>
                  <div>Koleksi: {parsedDetail.path || '-'}</div>
                  <div>Pesan: {parsedDetail.error || this.state.errorMessage}</div>
                </div>
              ) : (
                this.state.errorMessage
              )}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-2.5 px-4 rounded-lg bg-[#1D5CE5] hover:bg-[#164BC2] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
