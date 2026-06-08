import { useEffect, useRef } from 'react'

export function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
    if (!gl) {
      console.warn('WebGL not supported, falling back to DOM')
      return
    }

    // Resize handling
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        gl_PointSize = 2.0;
      }
    `

    // Fragment shader - dot matrix with warm orange glow
    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      
      // Noise function
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec2 center = vec2(0.5, 0.5);
        
        // Create dot matrix pattern
        vec2 grid = fract(uv * 40.0);
        float dot = smoothstep(0.5, 0.3, length(grid - 0.5));
        
        // Breathing pulse animation
        float pulse = sin(u_time * 0.5) * 0.5 + 0.5;
        
        // Distance from center for depth fade
        float dist = length(uv - center);
        float fade = 1.0 - smoothstep(0.0, 0.8, dist);
        
        // Mouse interaction - subtle drift
        vec2 mouseUV = u_mouse / u_resolution;
        float mouseDist = length(uv - mouseUV);
        float mouseEffect = smoothstep(0.3, 0.0, mouseDist) * 0.3;
        
        // Combine effects
        float intensity = dot * fade * (0.6 + pulse * 0.4 + mouseEffect);
        
        // Warm orange color (#EBB552 with soft glow)
        vec3 color = vec3(0.922, 0.710, 0.322); // #EBB552
        color *= intensity;
        
        // Add subtle depth with darker background
        vec3 bgColor = vec3(0.110, 0.196, 0.176); // #1C322D
        color = mix(bgColor, color, intensity);
        
        gl_FragColor = vec4(color, intensity * 0.4);
      }
    `

    // Compile shader
    function compileShader(source: string, type: number): WebGLShader | null {
      if (!gl) return null
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER)
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER)
    
    if (!vertexShader || !fragmentShader) return

    // Create program
    const program = gl.createProgram()
    if (!program) return
    
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return
    }

    gl.useProgram(program)

    // Set up full-screen quad
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ])

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    // Get uniform locations
    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse')

    // Mouse tracking
    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = window.innerHeight - e.clientY // Flip Y coordinate
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Animation loop
    let animationId: number
    const startTime = Date.now()

    const render = () => {
      const time = (Date.now() - startTime) / 1000

      gl.clearColor(0.110, 0.196, 0.176, 1.0) // #1C322D
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.uniform1f(timeLocation, time)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform2f(mouseLocation, mouseX, mouseY)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      animationId = requestAnimationFrame(render)
    }
    render()

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationId)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      gl.deleteBuffer(buffer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      id="webgl-canvas"
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
      style={{ background: '#1C322D' }}
    />
  )
}

// Made with Bob
