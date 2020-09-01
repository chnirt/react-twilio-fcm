import React from 'react'
import './App.css'
import { useRoutes } from 'react-router-dom'

import { PublicRoute, PrivateRoute, Loadable } from './hepler'
import {
	Login,
	Register,
	Channels,
	ChannelsIndex,
	Channel,
	CreateChannel,
	NotFound,
} from './screens'

import { Layout } from './layout'

export default function App() {
	// We removed the <BrowserRouter> element from App because the
	// useRoutes hook needs to be in the context of a <BrowserRouter>
	// element. This is a common pattern with React Router apps that
	// are rendered in different environments. To render an <App>,
	// you'll need to wrap it in your own <BrowserRouter> element.
	let element = useRoutes([
		// A route object has the same properties as a <Route>
		// element. The `children` is just an array of child routes.
		{
			path: '/',
			element: (
				<PublicRoute>
					{/* <Loadable url='../screens/Login' /> */}
					<Login />
				</PublicRoute>
			),
		},
		{
			path: '/register',
			element: (
				<PublicRoute>
					{/* <Loadable url='../screens/Register' /> */}
					<Register />
				</PublicRoute>
			),
		},
		{
			path: 'channels',
			element: (
				<PrivateRoute>
					<Layout>
						{/* <Loadable url='../screens/Channels' /> */}
						<Channels />
					</Layout>
				</PrivateRoute>
			),
			children: [
				{
					path: '/',
					element: (
						<>
							{/* <Loadable url='../screens/ChannelsIndex' /> */}
							<ChannelsIndex />
						</>
					),
				},
				{
					path: ':id',
					element: (
						<>
							{/* <Loadable url='../screens/Channel' /> */}
							<Channel />
						</>
					),
				},
				{
					path: 'create',
					element: (
						<>
							{/* <Loadable url='../screens/CreateChannel' /> */}
							<CreateChannel />
						</>
					),
				},
			],
		},
		{
			path: '*',
			element: (
				<>
					{/* <Loadable url='../screens/NotFound' /> */}
					<NotFound />
				</>
			),
		},
	])

	return element
}
