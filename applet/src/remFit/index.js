import RemFit from 'rem-fit'
import $dap from 'dap-util'

const { Phone } = $dap.platform.device()

if (Phone) {
    const remFit = new RemFit(7.5, true)
    remFit.init()
} else {
    const init = () => {
        const prop = Number(
            ((window.innerWidth * 13.34) / window.innerHeight).toFixed(2)
        )
        const remFit = new RemFit(prop, false)
        remFit.init()
    }
    init()
    window.addEventListener('resize', e => {
        init()
    })
}
