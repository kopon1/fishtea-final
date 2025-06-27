"use server"

import { Polar } from '@polar-sh/sdk'
import { redirect } from "next/navigation"

const polar = new Polar ({
accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? "",
server: "sandbox"
});

export const getBasic = async () => {
	const checkout = await polar.checkouts.create({
		products: 
		["7af83f16-219a-4540-a23d-c53a6a601e71",
		"92eab301-8538-4430-9420-e1bc7a641eca",
		"7c1f2fde-74ca-42ac-8ff3-9ad1d6972cd1"],
});

redirect(checkout.url)
}