import React from 'react';
import { NavLink } from 'react-router-dom';
import { getLinksByRole } from '../../data/navigation';

const Sidebar = ({ role }) => {
  const links = getLinksByRole(role);

  return (
    <aside className="w-64 bg-white border-r border-border min-h-screen hidden lg:block sticky top-16 overflow-y-auto max-h-[calc(100vh-64px)]">
      <div className="p-4 flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => 
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <link.icon size={20} />
            <span className="text-sm">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
