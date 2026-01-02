const drop = document.getElementById("drop")
const input = document.getElementById("img")
const loader = document.getElementById("loader")

drop.onclick = () => input.click()

drop.ondragover = e => {
    e.preventDefault()
    drop.classList.add("active")
}

drop.ondragleave = () => drop.classList.remove("active")

drop.ondrop = e => {
    e.preventDefault()
    input.files = e.dataTransfer.files
    drop.classList.remove("active")
}

async function convert(){
    if(!input.files.length) return
    loader.style.display="block"
    const form = new FormData()
    form.append("image",input.files[0])

    const res = await fetch("/extract",{method:"POST",body:form})
    const data = await res.json()

    loader.style.display="none"
    document.getElementById("output").innerText=data.text
    const link=document.getElementById("download")
    link.href=data.download
    link.innerText="DOWNLOAD TEXT"
}
