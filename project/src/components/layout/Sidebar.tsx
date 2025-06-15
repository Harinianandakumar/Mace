import { NavLink } from 'react-router-dom';
import {Truck, Package, Activity, AlertOctagon, BarChart3, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
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
      roles: ['mace sector head', 'mace engineer'] 
    },
    { 
      name: 'Inventory', 
      path: '/inventory', 
      icon: <Package className="h-5 w-5" />, 
      roles: ['mace sector head', 'manager', 'mace engineer'] 
    },
    { 
      name: 'Kilometer Entry', 
      path: '/kilometers', 
      icon: <Activity className="h-5 w-5" />, 
      roles: ['mace sector head', 'manager', 'mace engineer'] 
    },
    { 
      name: 'Stoppage Entry', 
      path: '/stoppages', 
      icon: <AlertOctagon className="h-5 w-5" />, 
      roles: ['mace sector head', 'manager', 'mace engineer'] 
    },
    { 
      name: 'Reports', 
      path: '/reports', 
      icon: <BarChart3 className="h-5 w-5" />, 
      roles: ['mace sector head', 'manager'] 
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
        className={`fixed inset-y-0 left-0 z-30 bg-blue-800 text-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 w-64' : 'lg:w-16 -translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-blue-700">
          <div className={`flex items-center ${!isOpen && 'lg:hidden'}`}>
            <Truck className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-semibold">MACE Track</span>
          </div>
          <div className={`${isOpen && 'hidden'} lg:flex lg:justify-center lg:w-full`}>
            <button 
              onClick={toggleSidebar} 
              className="text-white focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        <nav className={`mt-5 px-2 space-y-1 ${!isOpen && 'lg:px-0'}`}>
          {menuItems
            .filter(item => user && item.roles.includes(user.role))
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex ${!isOpen ? 'lg:justify-center' : 'items-center'} px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150 ${
                    isActive 
                      ? 'bg-blue-700 text-white' 
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`
                }
                title={!isOpen ? item.name : ''}
              >
                {item.icon}
                <span className={`ml-3 ${!isOpen && 'lg:hidden'}`}>{item.name}</span>
              </NavLink>
            ))}
        </nav>
        
        {/* Toggle button at the bottom for larger screens */}
        <div className="hidden lg:block absolute bottom-4 right-0 transform translate-x-1/2">
          <button
            onClick={toggleSidebar}
            className="bg-blue-700 text-white rounded-full p-1 shadow-lg hover:bg-blue-600 focus:outline-none"
          >
            {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;