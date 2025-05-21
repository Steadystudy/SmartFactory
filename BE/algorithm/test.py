raw_value="None Edge Error : AMR015"
raw_value.lower().startswith("none edge error")
amr_id = raw_value.split(":")[-1].strip()  # → 'AMR015'
print(amr_id)