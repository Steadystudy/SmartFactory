def calEdgeCutRoute(startCancelStartEndNode,cancelled_amrs):
    for i in range(len(startCancelStartEndNode)):
        amrId=cancelled_amrs[i]
        start=startCancelStartEndNode[i][0]
        dest=startCancelStartEndNode[i][1]
        print(amrId,start,dest)



cancelled_amrs=["AMR001","AMR002","AMR003"]
print(calEdgeCutRoute([(1,2),(3,4),(5,6)],cancelled_amrs))

