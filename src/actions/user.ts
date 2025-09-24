import User from "@/types/user";

export async function getUser(userId: number | string): Promise<User | null> {
  let user: User | null = null;

	try {
		const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users/${userId}`, { 
			headers: {
			"Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
			} 
		});

		const responseData = await response.json();

		if(response.ok) {
			user = responseData.data.user;
		}
  } catch(err) {
    console.error('Error while trying to get user', err);
  }

  return user;
}
