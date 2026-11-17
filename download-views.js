  const getComments = query(
    collection(db, "comments"),
    where("pageIndex", "==", currentPageIndex),
    orderBy("timestamp", "desc"),
  );