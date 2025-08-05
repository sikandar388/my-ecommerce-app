"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useIsAdmin from "@/lib/hooks/useIsAdmin";
import { useRouter } from "next/navigation";
import { Search, Users, Mail, Calendar, ShoppingBag, Download, Eye } from "lucide-react";

type OrderItem = {
  quantity: number;
  price: number;
  products?: {
    name: string;
    price: number;
  };
};

type Order = {
  user_id: string;
  email: string;
  created_at: string;
  order_items?: OrderItem[];
};

type User = {
  id: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  firstOrderDate: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"email" | "orderCount" | "totalSpent" | "lastOrderDate">("email");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, adminLoading, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        console.log("Fetching users data...");
        
        // First, let's try the original simpler query to see if it works
        const { data, error } = await supabase
          .from("orders")
          .select("*, order_items(*, products(*))");

        console.log("Query result:", { data, error });

        if (error) {
          console.error("Supabase error:", error);
          throw new Error(`Database error: ${error.message}`);
        }

        if (!data) {
          console.log("No data returned from query");
          setUsers([]);
          setFilteredUsers([]);
          return;
        }

        console.log("Processing", data.length, "orders");
        const userMap = new Map<string, User>();

        data.forEach((order: Order) => {
          console.log("Processing order:", { 
            user_id: order.user_id, 
            email: order.email, 
            created_at: order.created_at,
            order_items: order.order_items?.length || 0
          });

          if (order.user_id && order.email) {
            // Calculate order total
            let orderTotal = 0;
            if (order.order_items && Array.isArray(order.order_items)) {
              orderTotal = order.order_items.reduce((sum: number, item: OrderItem) => {
                const itemPrice = item.price || item.products?.price || 0;
                const quantity = item.quantity || 1;
                return sum + (quantity * itemPrice);
              }, 0);
            }

            const orderDate = order.created_at || new Date().toISOString();

            if (userMap.has(order.user_id)) {
              const existingUser = userMap.get(order.user_id)!;
              existingUser.orderCount += 1;
              existingUser.totalSpent += orderTotal;
              
              const currentOrderDate = new Date(orderDate);
              if (!existingUser.lastOrderDate || currentOrderDate > new Date(existingUser.lastOrderDate)) {
                existingUser.lastOrderDate = orderDate;
              }
              if (currentOrderDate < new Date(existingUser.firstOrderDate)) {
                existingUser.firstOrderDate = orderDate;
              }
            } else {
              userMap.set(order.user_id, {
                id: order.user_id,
                email: order.email,
                orderCount: 1,
                totalSpent: orderTotal,
                lastOrderDate: orderDate,
                firstOrderDate: orderDate,
              });
            }
          }
        });

        const uniqueUsers = Array.from(userMap.values());
        console.log("Processed users:", uniqueUsers.length);
        
        setUsers(uniqueUsers);
        setFilteredUsers(uniqueUsers);
      } catch (err) {
        console.error("Error in fetchUsers:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch users";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin && !adminLoading) {
      fetchUsers();
    }
  }, [isAdmin, adminLoading]);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue: string | number | null;
      let bValue: string | number | null;

      // Use proper type-safe property access
      switch (sortBy) {
        case "email":
          aValue = a.email;
          bValue = b.email;
          break;
        case "orderCount":
          aValue = a.orderCount;
          bValue = b.orderCount;
          break;
        case "totalSpent":
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        case "lastOrderDate":
          aValue = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
          bValue = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
          break;
        default:
          aValue = a.email;
          bValue = b.email;
      }

      // Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Ensure we have valid values for comparison
      const finalAValue = aValue ?? 0;
      const finalBValue = bValue ?? 0;

      if (sortOrder === "asc") {
        return finalAValue > finalBValue ? 1 : -1;
      } else {
        return finalAValue < finalBValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, sortBy, sortOrder]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToCSV = () => {
    const headers = ["User ID", "Email", "Order Count", "Total Spent", "Last Order", "First Order"];
    const csvData = [
      headers,
      ...filteredUsers.map(user => [
        user.id,
        user.email,
        user.orderCount.toString(),
        user.totalSpent.toString(),
        user.lastOrderDate || "",
        user.firstOrderDate
      ])
    ];

    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-6 w-64"></div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Users</div>
            <div className="text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          </div>
          <p className="text-gray-600">Manage and view all users based on order history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.reduce((sum, user) => sum + user.orderCount, 0)}
                </p>
              </div>
              <ShoppingBag className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(users.reduce((sum, user) => sum + user.totalSpent, 0))}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    users.reduce((sum, user) => sum + user.totalSpent, 0) /
                    users.reduce((sum, user) => sum + user.orderCount, 0) || 0
                  )}
                </p>
              </div>
              <Mail className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email or user ID..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "email" | "orderCount" | "totalSpent" | "lastOrderDate")}
                >
                  <option value="email">Email</option>
                  <option value="orderCount">Order Count</option>
                  <option value="totalSpent">Total Spent</option>
                  <option value="lastOrderDate">Last Order</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
            
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShoppingBag className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{user.orderCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(user.totalSpent)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.lastOrderDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.firstOrderDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "Try adjusting your search terms." : "No users have placed orders yet."}
              </p>
            </div>
          )}
        </div>

        {/* Pagination could be added here if needed */}
        {filteredUsers.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        )}
      </div>
    </div>
  );
}