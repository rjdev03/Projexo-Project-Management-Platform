import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { loadTheme } from '../features/themeSlice';
import { Loader2Icon, RefreshCw } from 'lucide-react';
import { useUser, SignIn, useAuth, CreateOrganization, useOrganizationList } from '@clerk/react';
import { fetchWorkspaces } from '../features/workspaceSlice';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const { loading, workspaces, hasFetched } = useAppSelector((state) => state.workspace);
    const dispatch = useAppDispatch();
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const { userMemberships } = useOrganizationList({ userMemberships: true });

    useEffect(() => {
        dispatch(loadTheme());
    }, [dispatch]);

    useEffect(() => {
        if (isLoaded && user && !hasFetched && !loading) {
            dispatch(fetchWorkspaces({ getToken }));
        }
    }, [user, isLoaded, hasFetched, loading, dispatch, getToken]);

    // Automatically trigger fetch when user creates their first organization in Clerk
    useEffect(() => {
        if (isLoaded && user && hasFetched && workspaces.length === 0 && (userMemberships.data?.length || 0) > 0) {
            dispatch(fetchWorkspaces({ getToken }));
        }
    }, [userMemberships.data?.length, isLoaded, user, hasFetched, workspaces.length, dispatch, getToken]);

    // 1. Show loader while Clerk initializes or initial fetch runs
    if (!isLoaded || (loading && !hasFetched)) {
        return (
            <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
                <Loader2Icon className="size-7 text-blue-500 animate-spin" />
            </div>
        );
    }

    // 2. Not logged in
    if (!user) {
        return (
            <div className='flex justify-center items-center h-screen bg-white dark:bg-zinc-950'>
                <SignIn />
            </div>
        );
    }

    // 3. Logged in, workspaces finished fetching, but user has no workspace
    if (hasFetched && workspaces.length === 0) {
        return (
            <div className='min-h-screen flex flex-col justify-center items-center gap-6 bg-white dark:bg-zinc-950 p-4'>
                <CreateOrganization />
                <button
                    type="button"
                    onClick={() => dispatch(fetchWorkspaces({ getToken }))}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 cursor-pointer font-medium"
                >
                    <RefreshCw className="size-4" /> Already created a workspace? Check now
                </button>
            </div>
        );
    }

    return (
        <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col h-screen">
                <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;