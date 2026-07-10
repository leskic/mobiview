# encoding: UTF-8

module MobiViewExporter
  module ViewsBuilder
    extend self

    VIEW_NAME = /(vista|eleva|frontal|lateral|planta|corte|^v\d+)/i

    def build(model, pieces)
      pages = model.pages.to_a
      named = pages.select { |page| page.name.to_s.match?(VIEW_NAME) }
      pages = named unless named.empty?

      if pages.empty?
        return [build_view("V01", "Principal", model.active_view.camera, pieces)]
      end

      pages.each_with_index.map do |page, index|
        build_view(
          format("V%02d", index + 1),
          page.name.to_s.empty? ? "Vista #{index + 1}" : page.name.to_s,
          page.camera,
          pieces,
          page.name.to_s
        )
      end
    rescue => error
      puts "ERRO AO GERAR VISTAS: #{error.message}"
      [build_view("V01", "Principal", model.active_view.camera, pieces)]
    end

    def build_view(id, name, camera, pieces, source_scene = nil)
      direction = camera.direction
      kind, projection = classify_direction(direction)
      {
        id: id,
        name: name,
        direction: kind,
        projection: projection,
        source_scene: source_scene,
        perspective: camera.perspective?,
        camera: {
          eye: point_array(camera.eye),
          target: point_array(camera.target),
          up: point_array(camera.up),
          direction: point_array(direction)
        },
        piece_ids: pieces.map { |piece| piece[:mv_uuid] }.compact
      }
    end

    def classify_direction(direction)
      x = direction.x.to_f
      y = direction.y.to_f
      z = direction.z.to_f
      if z.abs > x.abs && z.abs > y.abs
        [z.negative? ? "top" : "bottom", "xy"]
      elsif x.abs > y.abs
        [x.negative? ? "right" : "left", "yz"]
      else
        [y.negative? ? "front" : "back", "xz"]
      end
    end

    def point_array(value)
      [value.x.to_f, value.y.to_f, value.z.to_f]
    end
  end
end
