from rembg import remove, new_session
from PIL import Image
s=new_session("isnet-general-use")
for i in range(221,285):
    remove(Image.open(f"src/f/{i:03d}.png").convert("RGB"),session=s,only_mask=True).save(f"masks/{i:03d}.png")
print("masks done")
