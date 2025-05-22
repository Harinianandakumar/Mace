import { NavLink } from 'react-router-dom';
import {Truck, Package, Activity, AlertOctagon, BarChart3, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const { user } = useAuth();
  
  // Menu items with access control based on user role
  const menuItems = [

    { 
      name: 'Van Master', 
      path: '/vans', 
      icon: <Truck className="h-5 w-5" />, 
      roles: ['admin', 'driver'] 
    },
    { 
      name: 'Inventory', 
      path: '/inventory', 
      icon: <Package className="h-5 w-5" />, 
      roles: ['admin', 'manager', 'driver'] 
    },
    { 
      name: 'Kilometer Entry', 
      path: '/kilometers', 
      icon: <Activity className="h-5 w-5" />, 
      roles: ['admin', 'manager', 'driver'] 
    },
    { 
      name: 'Stoppage Entry', 
      path: '/stoppages', 
      icon: <AlertOctagon className="h-5 w-5" />, 
      roles: ['admin', 'manager', 'driver'] 
    },
    { 
      name: 'Reports', 
      path: '/reports', 
      icon: <BarChart3 className="h-5 w-5" />, 
      roles: ['admin', 'manager'] 
    },
  ];

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-blue-800 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-blue-700">
          <div className="flex items-center">
            <Truck className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-semibold">MACE Track</span>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="lg:hidden text-white focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-5 px-2 space-y-1">
          {menuItems
            .filter(item => user && item.roles.includes(user.role))
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150 ${
                    isActive 
                      ? 'bg-blue-700 text-white' 
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`
                }
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </NavLink>
            ))}
          
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;