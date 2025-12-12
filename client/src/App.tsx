import { Toaster } from 'react-hot-toast'
import ContactTable from './components/ContactTable'
import { LayoutDashboard } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-gray-900">
      <Toaster position="top-right" />

      {/* Navigation / Header */}
      <nav className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">Breezy<span className="text-blue-600">Admin</span></span>
            </div>
            <div className="flex items-center">
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">HubSpot Connected</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Contacts & Leads</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your smart home customers and AI-driven insights.</p>
        </div>

        <ContactTable />
      </main>
    </div>
  )
}

export default App
