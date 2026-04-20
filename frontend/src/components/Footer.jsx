import { Link } from 'react-router-dom';
import { Database, Heart } from 'lucide-react';

const Footer = () => (
  <footer className="border-t border-dark-600 mt-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Database size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">DataHub</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
            An open platform for sharing and discovering datasets for academic research, 
            machine learning, and data science projects.
          </p>
        </div>
        {/* Links */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Platform</h4>
          <ul className="space-y-2">
            {[['Explore Datasets', '/search'], ['Upload Dataset', '/upload'], ['Dashboard', '/dashboard']].map(([label, href]) => (
              <li key={href}>
                <Link to={href} className="text-sm text-gray-500 hover:text-primary-400 transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Account</h4>
          <ul className="space-y-2">
            {[['Sign Up', '/register'], ['Login', '/login']].map(([label, href]) => (
              <li key={href}>
                <Link to={href} className="text-sm text-gray-500 hover:text-primary-400 transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-dark-600 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-600 flex items-center gap-1">
          Built with <Heart size={12} className="text-red-500" fill="currentColor" /> for the data community
        </p>
        <div className="flex items-center gap-4">
          <a href="#" className="text-gray-600 hover:text-primary-400 transition-colors text-xs font-semibold">GitHub</a>
          <a href="#" className="text-gray-600 hover:text-primary-400 transition-colors text-xs font-semibold">Twitter</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
