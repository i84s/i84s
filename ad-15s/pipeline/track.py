import cv2, numpy as np, json
def load(i): return cv2.imread(f"src/f/{i:03d}.png")
# frame diffs to locate cuts/dissolves
prev=None; d=[]
for i in range(285):
    g=cv2.resize(cv2.cvtColor(load(i),cv2.COLOR_BGR2GRAY),(90,160)).astype(float)
    if prev is not None: d.append(round(float(np.abs(g-prev).mean()),1))
    prev=g
print("diffs 95-120", list(enumerate(d))[95:120])
print("diffs 195-222", list(enumerate(d))[195:222])
orb=cv2.ORB_create(3000)
def chain(a,b):
    H={a:np.eye(3)}
    for i in range(a+1,b+1):
        g1=cv2.cvtColor(load(i-1),cv2.COLOR_BGR2GRAY); g2=cv2.cvtColor(load(i),cv2.COLOR_BGR2GRAY)
        k1,d1=orb.detectAndCompute(g1,None); k2,d2=orb.detectAndCompute(g2,None)
        m=cv2.BFMatcher(cv2.NORM_HAMMING,crossCheck=True).match(d1,d2)
        p1=np.float32([k1[x.queryIdx].pt for x in m]); p2=np.float32([k2[x.trainIdx].pt for x in m])
        A,_=cv2.estimateAffinePartial2D(p1,p2,method=cv2.RANSAC,ransacReprojThreshold=2)
        H[i]=np.vstack([A,[0,0,1]])@H[i-1]   # ref(a) -> frame i
    return H
out={}
for name,(a,b) in {"stack":(217,284),"brk":(112,204)}.items():
    H=chain(a,b); out[name]={str(k):v.tolist() for k,v in H.items()}
    for k in [a,(a+b)//2,b]:
        M=H[k]; s=np.hypot(M[0,0],M[1,0]); print(name,k,"scale %.3f tx %.1f ty %.1f rot %.2f"%(s,M[0,2],M[1,2],np.degrees(np.arctan2(M[1,0],M[0,0]))))
json.dump(out,open("tracks.json","w"))
