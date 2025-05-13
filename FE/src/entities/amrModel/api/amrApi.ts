export const getRouteByAmrId = async (amrId: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_SERVER}/api/v1/status/amr/route/${amrId}`,
    );
    return response.json();
  } catch (error) {
    console.dir(error);
    return null;
  }
};
