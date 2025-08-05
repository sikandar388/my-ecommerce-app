"use client";

import useIsAdmin from "@/lib/hooks/useIsAdmin";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const { isAdmin, loading } = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/"); // redirect non-admins
    }
  }, [isAdmin, loading, router]);

  if (loading) return <p>Checking access...</p>;
  if (!isAdmin) return null; // temporary fallback while redirecting

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1> */}
      {/* Add your dashboard content here */}
    </div>
  );
}










// "use client";

// import useIsAdmin from "@/lib/hooks/useIsAdmin";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";
// import Link from "next/link";

// export default function AdminPage() {
//   const { isAdmin, loading } = useIsAdmin();
//   const router = useRouter();

//   useEffect(() => {
//     if (!loading && !isAdmin) {
//       router.push("/");
//     }
//   }, [isAdmin, loading, router]);

//   if (loading) return <p>Checking access...</p>;
//   if (!isAdmin) return null;

//   return (
//     <div className="max-w-6xl mx-auto py-8 px-4">
//       <h1 className="text-3xl font-bold mb-8 text-center">Sports Admin Dashboard</h1>
      
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {/* Quick Stats Cards */}
//         <DashboardCard 
//           title="Total Users" 
//           value="1,248" 
//           icon="👥"
//           link="/admin/users"
//           linkText="Manage Users"
//         />
        
//         <DashboardCard 
//           title="Active Events" 
//           value="24" 
//           icon="⚽"
//           link="/admin/events"
//           linkText="View Events"
//         />
        
//         <DashboardCard 
//           title="Pending Requests" 
//           value="8" 
//           icon="⏳"
//           link="/admin/requests"
//           linkText="Review"
//           alert
//         />

//         {/* Management Sections */}
//         <SectionCard title="Content Management">
//           <ul className="space-y-2">
//             <AdminLink href="/admin/teams" text="Teams Management" />
//             <AdminLink href="/admin/players" text="Players Database" />
//             <AdminLink href="/admin/matches" text="Matches & Fixtures" />
//             <AdminLink href="/admin/news" text="News & Articles" />
//           </ul>
//         </SectionCard>

//         <SectionCard title="User Management">
//           <ul className="space-y-2">
//             <AdminLink href="/admin/users" text="All Users" />
//             <AdminLink href="/admin/coaches" text="Coaches" />
//             <AdminLink href="/admin/referees" text="Referees" />
//             <AdminLink href="/admin/permissions" text="Permissions" />
//           </ul>
//         </SectionCard>

//         <SectionCard title="System">
//           <ul className="space-y-2">
//             <AdminLink href="/admin/settings" text="App Settings" />
//             <AdminLink href="/admin/analytics" text="Analytics" />
//             <AdminLink href="/admin/logs" text="Activity Logs" />
//             <AdminLink href="/admin/backup" text="Backup & Restore" />
//           </ul>
//         </SectionCard>
//       </div>

//       {/* Recent Activity Section */}
//       <div className="mt-12 bg-white rounded-lg shadow p-6">
//         <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
//         <div className="space-y-4">
//           <ActivityItem 
//             user="Coach Johnson" 
//             action="updated team roster" 
//             time="10 minutes ago"
//           />
//           <ActivityItem 
//             user="System" 
//             action="completed nightly backup" 
//             time="2 hours ago"
//           />
//           <ActivityItem 
//             user="Admin" 
//             action="added new match fixture" 
//             time="5 hours ago"
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// // Component for dashboard cards
// function DashboardCard({ title, value, icon, link, linkText, alert = false }: {
//   title: string;
//   value: string;
//   icon: string;
//   link: string;
//   linkText: string;
//   alert?: boolean;
// }) {
//   return (
//     <div className={`bg-white rounded-lg shadow p-6 ${alert ? 'border-l-4 border-red-500' : ''}`}>
//       <div className="flex justify-between items-start">
//         <div>
//           <p className="text-gray-600">{title}</p>
//           <p className="text-3xl font-bold mt-2">{value}</p>
//         </div>
//         <span className="text-3xl">{icon}</span>
//       </div>
//       <Link href={link} className={`mt-4 inline-block ${alert ? 'text-red-600 font-medium' : 'text-blue-600'}`}>
//         {linkText} →
//       </Link>
//     </div>
//   );
// }

// // Component for section cards
// function SectionCard({ title, children }: {
//   title: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="bg-white rounded-lg shadow p-6">
//       <h2 className="text-xl font-semibold mb-4">{title}</h2>
//       {children}
//     </div>
//   );
// }

// // Component for admin links
// function AdminLink({ href, text }: {
//   href: string;
//   text: string;
// }) {
//   return (
//     <li>
//       <Link href={href} className="text-blue-600 hover:underline flex items-center">
//         <span className="mr-2">•</span> {text}
//       </Link>
//     </li>
//   );
// }

// // Component for activity items
// function ActivityItem({ user, action, time }: {
//   user: string;
//   action: string;
//   time: string;
// }) {
//   return (
//     <div className="flex items-start">
//       <div className="bg-gray-100 rounded-full p-2 mr-3">
//         <span className="text-gray-600">👤</span>
//       </div>
//       <div>
//         <p className="font-medium">{user} <span className="font-normal text-gray-600">{action}</span></p>
//         <p className="text-sm text-gray-500">{time}</p>
//       </div>
//     </div>
//   );
// }